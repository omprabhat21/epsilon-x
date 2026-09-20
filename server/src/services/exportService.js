import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import { CATEGORIES } from '../config.js';
import * as db from './dbService.js';
import { computeComplianceScore } from './scoringService.js';

/**
 * Generate an official GeM Bid Compliance Verification Certificate PDF
 */
export async function generateAuditReportPdf(bidderId) {
  const bidder = await db.getBidderById(bidderId);
  if (!bidder) throw new Error('Bidder not found');

  const verificationResults = await db.getVerificationResults(bidderId);
  const scoreRecord = await db.getComplianceScore(bidderId);
  const calculatedScore = computeComplianceScore(verificationResults);

  const overallScore = scoreRecord ? Number(scoreRecord.overall_score) : calculatedScore.overall_score;
  const riskLevel = (scoreRecord?.risk_level || calculatedScore.risk_level || 'HIGH').toUpperCase();
  const officerDecision = (scoreRecord?.officer_decision || 'PENDING').toUpperCase();
  const officerNote = scoreRecord?.officer_note || 'No additional officer remarks recorded.';
  const generatedAt = new Date().toUTCString();

  // Create PDF Document (A4 format)
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Colors
  const navy = rgb(0.08, 0.12, 0.28);
  const slate = rgb(0.35, 0.4, 0.45);
  const dark = rgb(0.12, 0.12, 0.15);
  const lightGray = rgb(0.9, 0.92, 0.94);
  
  let y = 800;

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: 515,
    height: 60,
    color: rgb(0.96, 0.97, 1.0),
    borderColor: rgb(0.8, 0.85, 0.95),
    borderWidth: 1,
  });

  page.drawText('GOVERNMENT e-MARKETPLACE (GeM)', {
    x: 55,
    y: y - 20,
    size: 13,
    font: fontBold,
    color: navy,
  });

  page.drawText('STATUTORY BID COMPLIANCE AUDIT CERTIFICATE', {
    x: 55,
    y: y - 36,
    size: 10,
    font: fontBold,
    color: rgb(0.25, 0.35, 0.65),
  });

  page.drawText('SIH 2026 Problem Statement 26100 | Officer Verification Audit Record', {
    x: 55,
    y: y - 48,
    size: 8,
    font: fontRegular,
    color: slate,
  });

  y -= 75;

  // Bidder Summary Section
  page.drawText('1. BIDDER ENTITY INFORMATION', {
    x: 40,
    y,
    size: 10,
    font: fontBold,
    color: navy,
  });
  y -= 14;

  page.drawText(`Entity Name: ${bidder.name}`, { x: 40, y, size: 9.5, font: fontRegular, color: dark });
  page.drawText(`Audit ID: ${bidder.id}`, { x: 340, y, size: 8, font: fontRegular, color: slate });
  y -= 13;

  page.drawText(`PAN: ${bidder.pan || 'Referenced in Documents'}`, { x: 40, y, size: 9, font: fontRegular, color: dark });
  page.drawText(`GSTIN: ${bidder.gstin || 'Referenced in Documents'}`, { x: 200, y, size: 9, font: fontRegular, color: dark });
  page.drawText(`Udyam: ${bidder.udyam || 'Referenced in Documents'}`, { x: 360, y, size: 9, font: fontRegular, color: dark });
  y -= 20;

  // Score & Risk Section
  page.drawRectangle({
    x: 40,
    y: y - 40,
    width: 515,
    height: 45,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText('COMPLIANCE SCORE', { x: 55, y: y - 16, size: 8, font: fontBold, color: slate });
  page.drawText(`${overallScore} / 100`, { x: 55, y: y - 32, size: 14, font: fontBold, color: navy });

  page.drawText('STATUTORY RISK LEVEL', { x: 190, y: y - 16, size: 8, font: fontBold, color: slate });
  page.drawText(riskLevel, {
    x: 190,
    y: y - 32,
    size: 13,
    font: fontBold,
    color: riskLevel === 'LOW' ? rgb(0.06, 0.6, 0.35) : riskLevel === 'MEDIUM' ? rgb(0.85, 0.55, 0.05) : rgb(0.85, 0.2, 0.2),
  });

  page.drawText('OFFICER DETERMINATION', { x: 340, y: y - 16, size: 8, font: fontBold, color: slate });
  page.drawText(officerDecision, {
    x: 340,
    y: y - 32,
    size: 13,
    font: fontBold,
    color: officerDecision === 'QUALIFIED' ? rgb(0.06, 0.6, 0.35) : rgb(0.85, 0.2, 0.2),
  });

  y -= 60;

  // 9 Statutory Categories Table
  page.drawText('2. STATUTORY CATEGORY AUDIT VERIFICATION RESULTS', {
    x: 40,
    y,
    size: 10,
    font: fontBold,
    color: navy,
  });
  y -= 14;

  // Table Header
  page.drawRectangle({
    x: 40,
    y: y - 16,
    width: 515,
    height: 18,
    color: navy,
  });

  page.drawText('Category', { x: 45, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Weight', { x: 155, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Status', { x: 195, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Verification Reason / Finding', { x: 250, y: y - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  y -= 18;

  // Table Rows
  const categoriesList = Object.entries(CATEGORIES);
  for (let i = 0; i < categoriesList.length; i++) {
    const [key, meta] = categoriesList[i];
    const result = verificationResults.find((v) => v.category === key);
    let status = (result?.status || 'PENDING').toUpperCase();
    if (status === 'NOT_APPLICABLE' || status === 'EXEMPT') {
      status = 'N/A';
    }
    const reason = result?.reason || 'No document uploaded / pending verification';

    const rowBg = i % 2 === 0 ? rgb(0.98, 0.98, 0.99) : rgb(1, 1, 1);
    page.drawRectangle({
      x: 40,
      y: y - 22,
      width: 515,
      height: 24,
      color: rowBg,
      borderColor: lightGray,
      borderWidth: 0.5,
    });

    page.drawText(meta.name.slice(0, 22), { x: 45, y: y - 14, size: 7.5, font: fontBold, color: dark });
    page.drawText(`${meta.weight}%`, { x: 160, y: y - 14, size: 7.5, font: fontRegular, color: slate });

    let statusColor = slate;
    if (status === 'PASS') statusColor = rgb(0.06, 0.55, 0.3);
    else if (status === 'FAIL') statusColor = rgb(0.8, 0.15, 0.15);
    else if (status === 'UNCLEAR') statusColor = rgb(0.8, 0.5, 0.05);
    else if (status === 'N/A') statusColor = slate;

    page.drawText(status, { x: 195, y: y - 14, size: 7.5, font: fontBold, color: statusColor });

    // Truncate reason for table fit
    const trimmedReason = reason.length > 65 ? reason.slice(0, 62) + '...' : reason;
    page.drawText(trimmedReason, { x: 250, y: y - 14, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

    y -= 24;
  }

  y -= 15;

  // Officer Justification & Signature Stamp
  page.drawText('3. PROCUREMENT OFFICER AUDIT STAMP & JUSTIFICATION', {
    x: 40,
    y,
    size: 10,
    font: fontBold,
    color: navy,
  });
  y -= 14;

  page.drawRectangle({
    x: 40,
    y: y - 50,
    width: 515,
    height: 52,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText(`Recorded Officer Remarks: "${officerNote}"`, {
    x: 50,
    y: y - 16,
    size: 8,
    font: fontRegular,
    color: dark,
  });

  page.drawText(`Determination: [${officerDecision}] | Human Officer Decision Enforced`, {
    x: 50,
    y: y - 30,
    size: 8,
    font: fontBold,
    color: navy,
  });

  page.drawText(`Date & Time Stamped: ${generatedAt}`, {
    x: 50,
    y: y - 42,
    size: 7.5,
    font: fontRegular,
    color: slate,
  });

  // Cryptographic audit hash
  const hashPayload = `${bidderId}-${overallScore}-${riskLevel}-${officerDecision}-${generatedAt}`;
  const auditHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  y -= 65;
  page.drawText(`Cryptographic Audit Digest (SHA-256): ${auditHash}`, {
    x: 40,
    y,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText('Generated by Epsilon X AI Bid Compliance Verification Engine for GeM Procurement.', {
    x: 40,
    y: y - 10,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save({ useObjectStreams: false });
  return Buffer.from(pdfBytes);
}

/**
 * Generate an official GeM Bid Compliance CSV Audit Report
 */
export async function generateAuditReportCsv(bidderId) {
  const bidder = await db.getBidderById(bidderId);
  if (!bidder) throw new Error('Bidder not found');

  const verificationResults = await db.getVerificationResults(bidderId);
  const scoreRecord = await db.getComplianceScore(bidderId);
  const calculatedScore = computeComplianceScore(verificationResults);

  const overallScore = scoreRecord ? Number(scoreRecord.overall_score) : calculatedScore.overall_score;
  const riskLevel = scoreRecord?.risk_level || calculatedScore.risk_level || 'HIGH';
  const officerDecision = scoreRecord?.officer_decision || 'PENDING';
  const officerNote = (scoreRecord?.officer_note || '').replace(/"/g, '""');
  const timestamp = new Date().toISOString();

  let csv = '=== GeM BID COMPLIANCE AUDIT REPORT ===\n';
  csv += `Bidder Name,"${bidder.name.replace(/"/g, '""')}"\n`;
  csv += `Bidder ID,"${bidder.id}"\n`;
  csv += `Overall Compliance Score,${overallScore}\n`;
  csv += `Risk Level,"${riskLevel.toUpperCase()}"\n`;
  csv += `Officer Determination,"${officerDecision.toUpperCase()}"\n`;
  csv += `Officer Note,"${officerNote}"\n`;
  csv += `Generated At,"${timestamp}"\n\n`;

  csv += 'Category Key,Category Name,Statutory Weight (%),Status,Reason,Reference ID,Claimed Status\n';

  for (const [key, meta] of Object.entries(CATEGORIES)) {
    const result = verificationResults.find((v) => v.category === key);
    let status = (result?.status || 'PENDING').toUpperCase();
    if (status === 'NOT_APPLICABLE' || status === 'EXEMPT') {
      status = 'N/A';
    }
    const reason = (result?.reason || 'No document uploaded').replace(/"/g, '""');
    const refId = (result?.extracted_claim?.reference_id || 'N/A').replace(/"/g, '""');
    const claimedStatus = (result?.extracted_claim?.claimed_status || 'N/A').replace(/"/g, '""');

    csv += `"${key}","${meta.name}",${meta.weight},"${status}","${reason}","${refId}","${claimedStatus}"\n`;
  }

  return csv;
}
