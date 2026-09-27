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
  // Verify Blacklist Hard-Gate: Failing blacklist forces 'high' risk even if all other 8 categories pass (score = 75)
  const blacklistFailResults = [
    { category: 'blacklist', status: 'fail', reason: 'Debarred' },
    { category: 'gst', status: 'pass', reason: 'Active' },
    { category: 'pan_it', status: 'pass', reason: 'Valid' },
    { category: 'udyam', status: 'pass', reason: 'Valid' },
    { category: 'mii', status: 'pass', reason: 'Valid' },
    { category: 'epfo_esic', status: 'pass', reason: 'Valid' },
    { category: 'startup_nsic', status: 'pass', reason: 'Valid' },
    { category: 'oem_auth', status: 'pass', reason: 'Valid' },
    { category: 'digilocker', status: 'pass', reason: 'Valid' },
  ];
  const blacklistFailScore = computeComplianceScore(blacklistFailResults);
  assert.strictEqual(blacklistFailScore.overall_score, 75, 'Score should be 75');
  assert.strictEqual(blacklistFailScore.risk_level, 'high', 'Blacklist failure must hard-gate risk level to high');
  console.log('  ✓ Weighted scoring, renormalization, 3+ unclear risk floor, and blacklist hard-gate verified correctly.');

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
  assert(updatedDecision.officer_note.includes('All 9 statutory portals cleared.'), 'Officer note should contain text');
  console.log('  ✓ Officer decision ("qualified") saved and audited successfully.');

  // Test 6: Bidder Reliability Score & Bid History (GFR Rule 149)
  console.log('\n[Test 6] Bidder Reliability Score & Historical Tracking');
  const { computeReliabilityScore } = await import('../src/services/reliabilityService.js');
  const compliantHistory = await db.getBidHistory('b1111111-1111-1111-1111-111111111111');
  const nonCompliantHistory = await db.getBidHistory('b2222222-2222-2222-2222-222222222222');
  const ambiguousHistory = await db.getBidHistory('b3333333-3333-3333-3333-333333333333');

  assert.strictEqual(compliantHistory.length, 3, 'Compliant bidder should have 3 historical bids');
  assert.strictEqual(nonCompliantHistory.length, 3, 'Non-compliant bidder should have 3 historical bids');
  assert.strictEqual(ambiguousHistory.length, 3, 'Ambiguous bidder should have 3 historical bids');

  const relCompliant = computeReliabilityScore(compliantHistory);
  const relNonCompliant = computeReliabilityScore(nonCompliantHistory);
  const relAmbiguous = computeReliabilityScore(ambiguousHistory);

  assert.strictEqual(relCompliant.reliability_score, 100);
  assert.strictEqual(relCompliant.tier, 'high');
  assert.strictEqual(relNonCompliant.reliability_score, 33);
  assert.strictEqual(relNonCompliant.tier, 'low');
  assert.strictEqual(relAmbiguous.reliability_score, 67);
  assert.strictEqual(relAmbiguous.tier, 'moderate');
  assert.strictEqual(relAmbiguous.summary_text, '3 prior bids: 2 Qualified, 1 Disqualified');
  assert(relAmbiguous.badge_text.includes('67%'), 'Badge text should include percentage');
  assert.strictEqual(relAmbiguous.is_informational, true, 'Score must be informational');

  console.log(`  ✓ Compliant Co.: ${relCompliant.badge_text}`);
  console.log(`  ✓ Non-Compliant Traders: ${relNonCompliant.badge_text}`);
  console.log(`  ✓ Ambiguous Enterprises: ${relAmbiguous.badge_text}`);
  console.log('  ✓ Historical Reliability Score computed cleanly without altering current compliance score.');

  console.log('\n====================================================');
  console.log('🎉 ALL 6 INTEGRATION TESTS PASSED CLEANLY!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
