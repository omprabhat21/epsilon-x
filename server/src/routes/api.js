import express from 'express';
import multer from 'multer';
import { CATEGORIES, CATEGORY_KEYS, getSystemModeStatus } from '../config.js';
import * as db from '../services/dbService.js';
import { extractTextFromPdf } from '../services/pdfService.js';
import { extractDocumentClaim, verifyClaimAgainstPortal } from '../services/geminiService.js';
import { computeComplianceScore } from '../services/scoringService.js';
import { autoVerifySellerProfile } from '../services/sellerProfileService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * GET /api/system/status
 * Returns system mode (Live Supabase + Gemini vs Local Fallback)
 */
router.get('/system/status', (req, res) => {
  res.json(getSystemModeStatus());
});

/**
 * GET /api/categories
 * Returns the 9 categories and their statutory weights
 */
router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

/**
 * GET /api/bidders
 * List all bidders
 */
router.get('/bidders', async (req, res) => {
  try {
    const bidders = await db.getBidders();
    res.json(bidders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/seed
 * Reseed demo profiles, documents, and run verification pipeline
 */
router.post('/seed', async (req, res) => {
  try {
    const { seedAllBidderProfiles } = await import('../../scripts/seedData.js');
    await seedAllBidderProfiles();
    const bidders = await db.getBidders();
    res.json({ message: 'Seeding completed successfully', bidders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidders
 * Create a new bidder record
 */
router.post('/bidders', async (req, res) => {
  try {
    const { name, profile_template } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Bidder name is required.' });
    }

    // Determine baseline profile if selected or detected
    let detectedProfile = profile_template || null;
    if (!detectedProfile) {
      const lower = name.toLowerCase();
      if (lower.includes('bharat') || lower.includes('compliant')) detectedProfile = 'compliant';
      else if (lower.includes('apex') || lower.includes('non-compliant')) detectedProfile = 'non_compliant';
      else if (lower.includes('vanguard') || lower.includes('ambiguous')) detectedProfile = 'ambiguous';
    }

    const bidder = await db.createBidder(name.trim(), detectedProfile);

    // Automatically trigger Prompt B verification for the 5 Seller Profile Data categories (+ debarment check)
    console.log(`[Registration] Auto-verifying Seller Profile Data for new bidder: ${bidder.name} (profile: ${detectedProfile || 'genuinely_new'})`);
    await autoVerifySellerProfile(bidder.id);

    const fullBidder = await db.getBidderById(bidder.id);
    res.status(201).json(fullBidder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/bidders/:id
 * Remove a bidder entity and associated records
 */
router.delete('/bidders/:id', async (req, res) => {
  try {
    const bidderId = req.params.id;
    await db.deleteBidder(bidderId);
    res.json({ message: 'Bidder removed successfully', id: bidderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidders/:id/documents
 * Upload document (triggers pdf-parse + Prompt A)
 */
router.post('/bidders/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const bidderId = req.params.id;
    const { doc_type, raw_text: manualText } = req.body;

    if (!doc_type || !CATEGORIES[doc_type]) {
      return res.status(400).json({
        error: `Invalid or missing doc_type. Must be one of: ${CATEGORY_KEYS.join(', ')}`,
      });
    }

    const bidder = await db.getBidderById(bidderId);
    if (!bidder) {
      return res.status(404).json({ error: 'Bidder not found.' });
    }

    let extractedText = manualText;
    let fileUrl = null;

    if (req.file) {
      fileUrl = req.file.originalname;
      const parsed = await extractTextFromPdf(req.file.buffer);
      extractedText = parsed.raw_text;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error: 'No readable text content found in document. Non-OCR text extraction required.',
      });
    }

    // Store document in DB
    const doc = await db.createDocument({
      bidder_id: bidderId,
      doc_type,
      file_url: fileUrl,
      raw_text: extractedText,
    });

    // Run Prompt A: Structured Claim Extraction
    console.log(`[Pipeline] Extracting claims for bidder ${bidder.name}, category ${doc_type}`);
    const extractedClaim = await extractDocumentClaim(doc_type, extractedText);

    res.status(201).json({
      document: doc,
      extracted_claim: extractedClaim,
    });
  } catch (err) {
    console.error('[Pipeline Error] Document upload / extraction error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidders/:id/verify
 * Run Prompt B across all uploaded categories for this bidder
 */
router.post('/bidders/:id/verify', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const bidder = await db.getBidderById(bidderId);
    if (!bidder) {
      return res.status(404).json({ error: 'Bidder not found.' });
    }

    const documents = await db.getDocumentsByBidder(bidderId);
    
    // If no documents uploaded yet, re-run auto-verification on seller profile data
    if (!documents || documents.length === 0) {
      console.log(`[Pipeline] No documents uploaded for bidder ${bidder.name}. Auto-verifying Seller Profile categories.`);
      const sellerResults = await autoVerifySellerProfile(bidderId);
      const allResults = await db.getVerificationResults(bidderId);
      const scoreData = computeComplianceScore(allResults);
      return res.json({
        bidder,
        verification_results: allResults,
        score: scoreData,
      });
    }

    const verificationResults = [];

    for (const doc of documents) {
      const category = doc.doc_type;
      console.log(`[Pipeline] Verifying category: ${category} for bidder: ${bidder.name}`);

      // 1. Extract claims (Prompt A)
      const extractedClaim = await extractDocumentClaim(category, doc.raw_text);

      // 2. Fetch mock portal record
      let mockRecord = null;
      if (extractedClaim.reference_id && extractedClaim.reference_id !== 'ID-NOT-DETECTED') {
        mockRecord = await db.getPortalRecord(category, extractedClaim.reference_id);
      }
      
      // Fallback: match by bidder profile key if reference_id lookup missed
      if (!mockRecord && bidder.profile_key) {
        mockRecord = await db.getPortalRecordByProfile(category, bidder.profile_key);
      }

      // If still not found, fetch any default record for category
      if (!mockRecord) {
        mockRecord = await db.getPortalRecord(category);
      }

      // 3. Run Prompt B (Verification)
      const verdict = await verifyClaimAgainstPortal(category, extractedClaim, mockRecord);

      // 4. Store verification result
      const savedResult = await db.saveVerificationResult({
        bidder_id: bidderId,
        category,
        status: verdict.status,
        reason: verdict.reason,
        extracted_claim: extractedClaim,
        matched_record: mockRecord,
      });

      verificationResults.push(savedResult);
    }

    // 5. Compute compliance score over ALL verified categories (Seller Profile + Documents)
    const allResults = await db.getVerificationResults(bidderId);
    const scoreData = computeComplianceScore(allResults);
    await db.saveComplianceScore({
      bidder_id: bidderId,
      overall_score: scoreData.overall_score,
      risk_level: scoreData.risk_level,
    });

    res.json({
      bidder,
      verification_results: allResults,
      score: scoreData,
    });
  } catch (err) {
    console.error('[Pipeline Error] Verification run error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bidders/:id/score
 * Compute and return compliance score
 */
router.get('/api/bidders/:id/score', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const results = await db.getVerificationResults(bidderId);
    const scoreData = computeComplianceScore(results);
    res.json(scoreData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alias to match spec exactly
router.get('/bidders/:id/score', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const results = await db.getVerificationResults(bidderId);
    const scoreData = computeComplianceScore(results);
    res.json(scoreData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bidders/:id/decision
 * Officer submits final determination (qualified | disqualified) + note
 */
router.post('/bidders/:id/decision', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const { officer_decision, officer_note, officer_name } = req.body;

    if (!['qualified', 'disqualified', null].includes(officer_decision)) {
      return res.status(400).json({
        error: "officer_decision must be 'qualified', 'disqualified', or null.",
      });
    }

    const updated = await db.updateOfficerDecision(bidderId, officer_decision, officer_note, officer_name);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bidders/:id
 * Full dashboard view: bidder, documents, verification_results, score, officer_decision
 */
router.get('/bidders/:id', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const bidder = await db.getBidderById(bidderId);
    if (!bidder) {
      return res.status(404).json({ error: 'Bidder not found.' });
    }

    const documents = await db.getDocumentsByBidder(bidderId);
    const verificationResults = await db.getVerificationResults(bidderId);
    const scoreRecord = await db.getComplianceScore(bidderId);
    const calculatedScore = computeComplianceScore(verificationResults);

    // Build structured 9-category status map
    const categoryStatus = CATEGORY_KEYS.map((catKey) => {
      const result = verificationResults.find((v) => v.category === catKey);
      const doc = documents.find((d) => d.doc_type === catKey);
      return {
        category: catKey,
        name: CATEGORIES[catKey].name,
        weight: CATEGORIES[catKey].weight,
        reference_field: CATEGORIES[catKey].referenceField,
        status: result ? result.status : 'pending_verification',
        reason: result ? result.reason : (doc ? 'Document uploaded, verification pending' : 'No document uploaded'),
        extracted_claim: result ? result.extracted_claim : null,
        matched_record: result ? result.matched_record : null,
        has_document: Boolean(doc),
        document_id: doc ? doc.id : null,
      };
    });

    res.json({
      bidder,
      documents,
      verification_results: verificationResults,
      categories: categoryStatus,
      score: {
        overall_score: scoreRecord ? Number(scoreRecord.overall_score) : calculatedScore.overall_score,
        risk_level: scoreRecord ? scoreRecord.risk_level : calculatedScore.risk_level,
        officer_decision: scoreRecord ? scoreRecord.officer_decision : null,
        officer_note: scoreRecord ? scoreRecord.officer_note : null,
        details: calculatedScore,
      },
      system: getSystemModeStatus(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bidders/:id/export/pdf
 * Download signed GeM compliance audit certificate PDF
 */
router.get('/bidders/:id/export/pdf', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const { generateAuditReportPdf } = await import('../services/exportService.js');
    const pdfBuffer = await generateAuditReportPdf(bidderId);
    const bidder = await db.getBidderById(bidderId);
    const sanitizedName = (bidder?.name || 'Bidder').replace(/[^a-zA-Z0-9_-]/g, '_');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="GeM_Audit_Certificate_${sanitizedName}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bidders/:id/export/csv
 * Download structured CSV compliance audit report
 */
router.get('/bidders/:id/export/csv', async (req, res) => {
  try {
    const bidderId = req.params.id;
    const { generateAuditReportCsv } = await import('../services/exportService.js');
    const csvContent = await generateAuditReportCsv(bidderId);
    const bidder = await db.getBidderById(bidderId);
    const sanitizedName = (bidder?.name || 'Bidder').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="GeM_Audit_Report_${sanitizedName}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
