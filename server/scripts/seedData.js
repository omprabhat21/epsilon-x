import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORY_KEYS } from '../src/config.js';
import * as db from '../src/services/dbService.js';
import { extractTextFromPdf } from '../src/services/pdfService.js';
import { extractDocumentClaim, verifyClaimAgainstPortal } from '../src/services/geminiService.js';
import { computeComplianceScore } from '../src/services/scoringService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '../../samples');

export async function seedAllBidderProfiles() {
  console.log('====================================================');
  console.log('  SEEDING BIDDERS, DOCUMENTS & RUNNING AI PIPELINE  ');
  console.log('====================================================');

  const bidders = await db.getBidders();
  console.log(`Found ${bidders.length} target bidders.`);

  for (const bidder of bidders) {
    if (!bidder.profile_key) {
      console.log(`\n[Reset] Removing custom test bidder: ${bidder.name}`);
      await db.deleteBidder(bidder.id);
      continue;
    }
    console.log(`\nProcessing Bidder: ${bidder.name} (${bidder.profile_key})`);
    const profileDir = path.join(SAMPLES_DIR, bidder.profile_key);

    if (!fs.existsSync(profileDir)) {
      console.warn(`  Directory not found: ${profileDir}`);
      continue;
    }

    const verificationResults = [];

    for (const category of CATEGORY_KEYS) {
      const pdfPath = path.join(profileDir, `${category}.pdf`);
      if (!fs.existsSync(pdfPath)) {
        console.warn(`  Missing PDF for category: ${category}`);
        continue;
      }

      // Step 1: Read and parse PDF
      console.log(`-> Parsing PDF for category: ${category}`);
      const pdfBuffer = fs.readFileSync(pdfPath);
      const parsed = await extractTextFromPdf(pdfBuffer);

      // Step 2: Store Document
      const doc = await db.createDocument({
        bidder_id: bidder.id,
        doc_type: category,
        file_url: `${bidder.profile_key}/${category}.pdf`,
        raw_text: parsed.raw_text,
      });

      // Step 3: Prompt A - Extract Claims
      const extractedClaim = await extractDocumentClaim(category, parsed.raw_text);

      // Step 4: Fetch Portal Ground Truth
      let mockRecord = null;
      if (extractedClaim.reference_id && extractedClaim.reference_id !== 'ID-NOT-DETECTED') {
        mockRecord = await db.getPortalRecord(category, extractedClaim.reference_id);
      }
      if (!mockRecord) {
        mockRecord = await db.getPortalRecordByProfile(category, bidder.profile_key);
      }

      // Step 5: Prompt B - Verify
      const verdict = await verifyClaimAgainstPortal(category, extractedClaim, mockRecord);

      // Step 6: Store verification result
      const savedResult = await db.saveVerificationResult({
        bidder_id: bidder.id,
        category,
        status: verdict.status,
        reason: verdict.reason,
        extracted_claim: extractedClaim,
        matched_record: mockRecord,
      });

      verificationResults.push(savedResult);
      console.log(`  [${category.padEnd(12)}] -> ${verdict.status.toUpperCase()}: ${verdict.reason.slice(0, 60)}...`);
    }

    // Step 7: Compute Aggregate Score
    const scoreData = computeComplianceScore(verificationResults);
    await db.saveComplianceScore({
      bidder_id: bidder.id,
      overall_score: scoreData.overall_score,
      risk_level: scoreData.risk_level,
    });

    console.log(`\n  >> Aggregate Score: ${scoreData.overall_score} / 100 | Risk Level: ${scoreData.risk_level.toUpperCase()}`);
  }

  console.log('\n====================================================');
  console.log('✓ Seeding & Verification Pipeline Completed!');
  console.log('====================================================');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedAllBidderProfiles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
