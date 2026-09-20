import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES } from '../src/config.js';
import { computeComplianceScore } from '../src/services/scoringService.js';
import { extractTextFromPdf } from '../src/services/pdfService.js';
import { extractDocumentClaim, verifyClaimAgainstPortal } from '../src/services/geminiService.js';
import * as db from '../src/services/dbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../../samples');

async function runAllTests() {
  console.log('--- Starting Automated Test Suite for Epsilon X ---');

  // Test 1: Scoring logic with weight renormalization
  console.log('\n[Test 1] Scoring Calculation & Weight Renormalization');
  const sampleResults = [
    { category: 'blacklist', status: 'pass', reason: 'Clear' }, // weight 25 -> 25
    { category: 'gst', status: 'pass', reason: 'Active' }, // weight 15 -> 15
    { category: 'pan_it', status: 'pass', reason: 'Valid' }, // weight 15 -> 15
    { category: 'udyam', status: 'unclear', reason: 'Ambiguous entity' }, // weight 10 -> 5 (0.5 * 10)
    { category: 'mii', status: 'unclear', reason: 'Self-declaration' }, // weight 10 -> 5 (0.5 * 10)
    { category: 'epfo_esic', status: 'pass', reason: 'Active' }, // weight 10 -> 10
    { category: 'startup_nsic', status: 'not_applicable', reason: 'MSE exemption not sought' }, // weight 5 -> EXCLUDED
    { category: 'oem_auth', status: 'unclear', reason: 'Tier-2 distributor' }, // weight 5 -> 2.5 (0.5 * 5)
    { category: 'digilocker', status: 'pass', reason: 'Hash match' }, // weight 5 -> 5
  ];

  // Applicable weight sum: 25+15+15+10+10+10+5+5 = 95
  // Earned weight: 25 + 15 + 15 + 5 + 5 + 10 + 2.5 + 5 = 82.5
  // Expected Score: (82.5 / 95) * 100 = 86.8
  // Has 3 unclear categories (udyam, mii, oem_auth) -> Risk floored at 'medium' regardless of score >= 80
  const scoreResult = computeComplianceScore(sampleResults);
  assert.strictEqual(scoreResult.renormalized, true, 'Should flag as renormalized');
  assert.strictEqual(scoreResult.total_applicable_weight, 95, 'Total applicable weight should be 95');
  assert.strictEqual(scoreResult.overall_score, 86.8, 'Calculated score should be 86.8');
  assert.strictEqual(scoreResult.unclear_count, 3, 'Unclear count should be 3');
  assert.strictEqual(scoreResult.risk_level, 'medium', 'Score 86.8 with 3+ unclear categories must be medium risk (risk floor rule)');

  // Verify that with < 3 unclear categories (e.g. 2 unclear), score >= 80 achieves 'low' risk
  const lowRiskResults = sampleResults.map(r => r.category === 'oem_auth' ? { ...r, status: 'pass' } : r);
  const lowRiskScore = computeComplianceScore(lowRiskResults);
  assert.strictEqual(lowRiskScore.unclear_count, 2, 'Unclear count should be 2');
  assert.strictEqual(lowRiskScore.risk_level, 'low', 'Score >= 80 with < 3 unclear categories should be low risk');
  console.log('  ✓ Weighted scoring, renormalization, and 3+ unclear risk floor rule verified correctly.');

  // Test 2: Text extraction from PDF
  console.log('\n[Test 2] Document Text Extraction via pdf-parse');
  const pdfBuffer = fs.readFileSync(path.join(SAMPLES_DIR, 'compliant/gst.pdf'));
  const parsedPdf = await extractTextFromPdf(pdfBuffer);
  assert(parsedPdf.raw_text.includes('29AAACB1234F1Z5'), 'Extracted text should contain GSTIN');
  assert(parsedPdf.raw_text.includes('Bharat Tech Solutions Pvt Ltd'), 'Extracted text should contain entity name');
  console.log('  ✓ PDF text extraction succeeded without OCR dependencies.');

  // Test 3: Prompt A - Claim Extraction
  console.log('\n[Test 3] Prompt A - Structured Claim Extraction');
  const claim = await extractDocumentClaim('gst', parsedPdf.raw_text);
  assert.strictEqual(claim.reference_id, '29AAACB1234F1Z5', 'Extracted reference ID should match GSTIN');
  assert(claim.claimed_status.includes('Active'), 'Claimed status should be Active');
  console.log(`  ✓ Extracted claim: ID=${claim.reference_id}, Status=${claim.claimed_status}`);

  // Test 4: Prompt B - Verification against Mock Record
  console.log('\n[Test 4] Prompt B - Cross-Verification against Government Portal Record');
  const portalRecord = await db.getPortalRecord('gst', claim.reference_id);
  assert(portalRecord, 'Should find portal record for GSTIN');
  const verdict = await verifyClaimAgainstPortal('gst', claim, portalRecord);
  assert.strictEqual(verdict.status, 'pass', 'Status should be pass for compliant GST');
  assert(verdict.reason.length > 10, 'Reason sentence should be present');
  console.log(`  ✓ Verification verdict: ${verdict.status.toUpperCase()} — "${verdict.reason}"`);

  // Test 5: Officer determination persistence
  console.log('\n[Test 5] Officer Determination');
  const bidders = await db.getBidders();
  const testBidder = bidders[0];
  const updatedDecision = await db.updateOfficerDecision(testBidder.id, 'qualified', 'All 9 statutory portals cleared.');
  assert.strictEqual(updatedDecision.officer_decision, 'qualified');
  assert.strictEqual(updatedDecision.officer_note, 'All 9 statutory portals cleared.');
  console.log('  ✓ Officer decision ("qualified") saved and audited successfully.');

  console.log('\n====================================================');
  console.log('🎉 ALL 5 INTEGRATION TESTS PASSED CLEANLY!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
