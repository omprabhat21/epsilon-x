/**
 * Prompt B — Compliance Verification against Government Portal Data
 * Verifies the extracted claim against ground truth portal record.
 */
export function buildVerificationPrompt(category, extractedClaim, mockPortalRecord) {
  return `You are verifying a bidder's compliance claim for category: ${category}.

Claim extracted from the bidder's document:
${JSON.stringify(extractedClaim, null, 2)}

Reference data from the government portal:
${JSON.stringify(mockPortalRecord, null, 2)}

Compare the claim against the reference data. Return JSON only:
{
  "status": "pass" | "fail" | "unclear" | "not_applicable",
  "reason": "<one clear sentence explaining the verdict>"
}

Rules:
- "pass": the claim matches the reference data and the status is valid/active.
- "fail": there is a clear, confirmed mismatch or the reference shows an invalid/cancelled/blacklisted status.
- "unclear": the claim cannot be confidently matched (e.g. ambiguous ownership, ambiguous applicability, missing reference data) — do not force a pass or fail.
- "not_applicable": this category does not apply to this bidder (e.g. MSE exemption applies, so turnover-linked checks are skipped).`;
}
