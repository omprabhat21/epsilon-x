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
 * Automatically compiles summary text block from category verification results
 * Lists every category with status 'fail' or 'unclear' and its reason
 * e.g. "GST: FAIL — GSTIN cancelled under Section 29(2)(c). Blacklist: FAIL — Debarred until 2027-03-01."
 */
export function generateAiAuditSummary(categories = []) {
  if (!categories || categories.length === 0) {
    return 'Pending statutory verification. No category findings recorded.';
  }

  // Deduplicate by category key
  const categoryMap = new Map();
  for (const c of categories) {
    const key = c.category || c.doc_type;
    if (key) {
      categoryMap.set(key, c);
    }
  }

  const flagged = [];
  for (const [key, item] of categoryMap.entries()) {
    const status = (item?.status || '').toLowerCase();
    if (status === 'fail' || status === 'unclear') {
      const shortLabel = CATEGORY_SHORT_LABELS[key] || item?.name?.split('/')[0]?.trim() || key;
      const statusText = status.toUpperCase();
      const reason = item?.reason?.trim() || 'No specific finding recorded.';
      flagged.push(`${shortLabel}: ${statusText} — ${reason}`);
    }
  }

  if (flagged.length === 0) {
    return 'All statutory categories verified compliant. No compliance flags or unclear records detected.';
  }

  return flagged.join(' ');
}

/**
 * Checks if the officer's decision disagrees with the AI Recommendation
 * Returns boolean (true if override, false if agreement / concordant)
 */
export function determineOfficerOverride(officerDecision, riskLevel, categories = []) {
  if (!officerDecision) return false;

  const decisionNorm = officerDecision.toLowerCase();
  const riskNorm = (riskLevel || '').toLowerCase();

  const hasFails = categories.some((c) => (c?.status || '').toLowerCase() === 'fail');

  let aiAction = 'MANUAL_REVIEW';
  if (riskNorm === 'low' && !hasFails) {
    aiAction = 'QUALIFY';
  } else if (riskNorm === 'high' || hasFails) {
    aiAction = 'DISQUALIFY';
  }

  if (aiAction === 'QUALIFY' && decisionNorm === 'disqualified') {
    return true;
  }
  if (aiAction === 'DISQUALIFY' && decisionNorm === 'qualified') {
    return true;
  }

  return false;
}
