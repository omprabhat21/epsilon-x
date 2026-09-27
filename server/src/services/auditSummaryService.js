import { CATEGORIES } from '../config.js';

// Short category labels for concise audit reporting
const CATEGORY_SHORT_LABELS = {
  blacklist: 'Blacklist',
  gst: 'GST',
  pan_it: 'PAN / IT',
  udyam: 'Udyam',
  mii: 'Make in India',
  epfo_esic: 'EPFO / ESIC',
  startup_nsic: 'Startup / NSIC',
  oem_auth: 'OEM Auth',
  digilocker: 'DigiLocker',
};

/**
 * Generate human-readable summary text block from verification results
 * Lists every category with status 'fail' or 'unclear' along with its reason
 * e.g. "GST: FAIL — GSTIN cancelled under Section 29(2)(c). Blacklist: FAIL — Debarred until 2027-03-01."
 */
export function generateAiAuditSummary(verificationResults) {
  if (!verificationResults || verificationResults.length === 0) {
    return 'Pending statutory verification. No category findings recorded.';
  }

  // Deduplicate by category if needed
  const categoryMap = new Map();
  for (const r of verificationResults) {
    if (r && r.category) {
      categoryMap.set(r.category, r);
    }
  }

  const flagged = [];
  for (const [catKey, result] of categoryMap.entries()) {
    const status = (result?.status || '').toLowerCase();
    if (status === 'fail' || status === 'unclear') {
      const shortLabel = CATEGORY_SHORT_LABELS[catKey] || CATEGORIES[catKey]?.name || catKey;
      const statusText = status.toUpperCase();
      const reason = result?.reason?.trim() || 'No specific reason reported.';
      flagged.push(`${shortLabel}: ${statusText} — ${reason}`);
    }
  }

  if (flagged.length === 0) {
    return 'All statutory categories verified compliant. No compliance flags or unclear records detected.';
  }

  return flagged.join(' ');
}

/**
 * Determine if the officer decision constitutes an override of AI recommendation
 * AI Recommendation logic:
 * - 'low' risk: AI recommended 'Qualify'
 * - 'high' risk (or any 'fail' category): AI recommended 'Disqualify'
 * - 'medium' risk without fails: 'Manual Review Required'
 *
 * Mismatch flag:
 * - Officer selects 'qualified' when AI recommended Disqualify -> true
 * - Officer selects 'disqualified' when AI recommended Qualify -> true
 * - Otherwise -> false
 */
export function determineOfficerOverride(officerDecision, riskLevel, verificationResults = []) {
  if (!officerDecision) return false;

  const normalizedDecision = officerDecision.toLowerCase();
  const normalizedRisk = (riskLevel || '').toLowerCase();

  const hasFails = (verificationResults || []).some(
    (v) => (v?.status || '').toLowerCase() === 'fail'
  );

  let aiAction = 'MANUAL_REVIEW';
  if (normalizedRisk === 'low' && !hasFails) {
    aiAction = 'QUALIFY';
  } else if (normalizedRisk === 'high' || hasFails) {
    aiAction = 'DISQUALIFY';
  }

  if (aiAction === 'QUALIFY' && normalizedDecision === 'disqualified') {
    return true;
  }
  if (aiAction === 'DISQUALIFY' && normalizedDecision === 'qualified') {
    return true;
  }

  return false;
}
