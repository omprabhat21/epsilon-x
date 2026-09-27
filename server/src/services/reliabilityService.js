/**
 * EPSILON X — BIDDER RELIABILITY SERVICE
 * Computes Bidder Reliability Score based on past historical tender adjudications.
 *
 * Statutory Adjudication Principle:
 * Purely informational for the procurement officer under GFR 2017 Rule 149.
 * Does NOT alter the current 9-dimensional compliance score or override statutory checks.
 */

/**
 * Compute the Reliability Score from an array of past bid history records.
 *
 * @param {Array} history - Array of { bidder_id, tender_ref, score, risk_level, officer_decision, date }
 * @returns {Object} Reliability assessment object
 */
export function computeReliabilityScore(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      reliability_score: null,
      total_bids: 0,
      qualified_bids: 0,
      disqualified_bids: 0,
      badge_text: 'Reliability: N/A (New Bidder — No Prior Bids)',
      short_badge_text: 'New Bidder (0 bids)',
      summary_text: 'No prior bids on record',
      tier: 'new', // 'high' | 'moderate' | 'low' | 'new'
      is_informational: true,
      statutory_notice:
        'Informational Reference Only: Historical reliability provides procurement officers with longitudinal vendor performance context. This score is advisory only — it does not alter the current statutory compliance score, risk classification, or any of the 9 statutory category verifications.',
    };
  }

  const total = history.length;
  const qualified = history.filter(
    (b) => (b.officer_decision || '').toLowerCase() === 'qualified'
  ).length;
  const disqualified = history.filter(
    (b) => (b.officer_decision || '').toLowerCase() === 'disqualified'
  ).length;

  const percentage = Math.round((qualified / total) * 100);

  let tier = 'low';
  if (percentage >= 80) {
    tier = 'high';
  } else if (percentage >= 50) {
    tier = 'moderate';
  }

  return {
    reliability_score: percentage,
    total_bids: total,
    qualified_bids: qualified,
    disqualified_bids: disqualified,
    badge_text: `Reliability: ${percentage}% (${qualified} of ${total} past bids compliant)`,
    short_badge_text: `${percentage}% Reliable (${qualified}/${total})`,
    summary_text: `${total} prior bids: ${qualified} Qualified, ${disqualified} Disqualified`,
    tier,
    is_informational: true,
    statutory_notice:
      'Informational Reference Only: Historical reliability provides procurement officers with longitudinal vendor performance context. This score is advisory only — it does not alter the current statutory compliance score, risk classification, or any of the 9 statutory category verifications.',
  };
}
