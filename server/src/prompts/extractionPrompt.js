/**
 * Prompt A — Document Claim Extraction
 * Extracts structured statutory claims from parsed document text.
 */
export function buildExtractionPrompt(category, rawText) {
  return `You are extracting structured claims from a bidder's compliance document for category: ${category}.

Document text:
${rawText}

Extract the following fields as JSON only, no other text:
{
  "reference_id": "<the GSTIN/Udyam number/PAN/etc. found in the document>",
  "claimed_status": "<status as stated in the document>",
  "claimed_dates": "<any relevant dates found>",
  "additional_claims": "<any other relevant claim for this category>"
}

If a field cannot be found, use null. Do not guess or fabricate values.`;
}
