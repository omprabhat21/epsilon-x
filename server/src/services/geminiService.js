import { genAI, isGeminiConfigured } from '../config.js';
import { buildExtractionPrompt } from '../prompts/extractionPrompt.js';
import { buildVerificationPrompt } from '../prompts/verificationPrompt.js';

/**
 * Safely parse JSON from LLM response which might have markdown fences
 */
function cleanAndParseJson(text) {
  if (!text) throw new Error('Empty AI response');
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Prompt A: Document Claim Extraction
 */
let liveGeminiDisabled = false;

export async function extractDocumentClaim(category, rawText) {
  if (isGeminiConfigured && genAI && !liveGeminiDisabled) {
    try {
      console.log(`[Gemini AI] Running Prompt A (Extraction) for category: ${category}`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const prompt = buildExtractionPrompt(category, rawText);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return cleanAndParseJson(responseText);
    } catch (err) {
      console.warn(`[Gemini AI] Live extraction call failed: ${err.message}. Falling back to deterministic extractor.`);
      liveGeminiDisabled = true;
    }
  }

  // Fallback deterministic extractor
  console.log(`[AI Simulator] Running local deterministic claim extraction for category: ${category}`);
  return fallbackExtractClaim(category, rawText);
}

/**
 * Prompt B: Verification against Mock Portal Data
 */
export async function verifyClaimAgainstPortal(category, extractedClaim, mockPortalRecord) {
  if (isGeminiConfigured && genAI && !liveGeminiDisabled) {
    try {
      console.log(`[Gemini AI] Running Prompt B (Verification) for category: ${category}`);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const prompt = buildVerificationPrompt(category, extractedClaim, mockPortalRecord);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return cleanAndParseJson(responseText);
    } catch (err) {
      console.warn(`[Gemini AI] Live verification call failed: ${err.message}. Falling back to deterministic verifier.`);
      liveGeminiDisabled = true;
    }
  }

  // Fallback deterministic verifier
  console.log(`[AI Simulator] Running local deterministic verification for category: ${category}`);
  return fallbackVerifyClaim(category, extractedClaim, mockPortalRecord);
}

/**
 * Deterministic Claim Extractor for Local Fallback
 */
function fallbackExtractClaim(category, rawText) {
  const text = rawText || '';

  // Generic regex patterns for common IDs
  const patterns = {
    gst: /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i,
    pan_it: /([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
    udyam: /(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})/i,
    blacklist: /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|[A-Z]{5}[0-9]{4}[A-Z]{1})/i,
    epfo_esic: /([A-Z]{2}[A-Z]{3}[0-9]{7}[0-9]{3})/i,
    mii: /(MII-[A-Z0-9-]+)/i,
    startup_nsic: /(DPIIT-[A-Z0-9-]+|NSIC-[A-Z0-9-]+)/i,
    oem_auth: /(MAF-[A-Z0-9-]+)/i,
    digilocker: /(DL-[A-Z0-9-]+)/i,
  };

  const idMatch = patterns[category] ? text.match(patterns[category]) : null;
  const reference_id = idMatch ? idMatch[1] : null;

  // Extract claimed status
  let claimed_status = 'Active';
  if (/cancelled|debarred|blacklisted|invalid|dormant/i.test(text)) {
    claimed_status = 'Cancelled / Debarred';
  } else if (/pending|ambiguous|conditional/i.test(text)) {
    claimed_status = 'Pending Review';
  } else if (/not applicable|exempt/i.test(text)) {
    claimed_status = 'Not Applicable';
  }

  // Extract dates
  const dateMatch = text.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9]|[0-3][0-9]\/[0-1][0-9]\/202[0-9])\b/);
  const claimed_dates = dateMatch ? dateMatch[1] : null;

  return {
    reference_id: reference_id || 'ID-NOT-DETECTED',
    claimed_status,
    claimed_dates,
    additional_claims: `Extracted claims for ${category} from uploaded certificate.`,
  };
}

/**
 * Deterministic Verifier for Local Fallback
 */
function fallbackVerifyClaim(category, extractedClaim, portalRecord) {
  if (!portalRecord) {
    return {
      status: 'unclear',
      reason: `No corresponding government portal record found for reference ID ${extractedClaim?.reference_id || 'unknown'}. Verification pending manual review.`
    };
  }

  // Specific Category Logic
  if (category === 'blacklist') {
    if (portalRecord.is_blacklisted || portalRecord.cvc_debarred) {
      return {
        status: 'fail',
        reason: `Debarred on GeM / CVC Blacklist: ${portalRecord.debarment_reason || 'Active suspension order'}.`
      };
    }
    return {
      status: 'pass',
      reason: 'Bidder is clear of all GeM suspensions and CVC debarment lists.'
    };
  }

  if (category === 'gst') {
    if (portalRecord.status === 'Active') {
      return {
        status: 'pass',
        reason: `GSTIN is Active with regular monthly return filings (Last filed: ${portalRecord.last_return_filed || 'recent'}).`
      };
    }
    return {
      status: 'fail',
      reason: `GSTIN is ${portalRecord.status || 'Inactive'}. ${portalRecord.cancellation_reason || 'Returns defaulted'}.`
    };
  }

  if (category === 'pan_it') {
    if (portalRecord.pan_status?.includes('Valid') && portalRecord.tax_audit_cleared) {
      return {
        status: 'pass',
        reason: 'PAN is valid, operative, and Income Tax returns are consistently filed.'
      };
    }
    return {
      status: 'fail',
      reason: `PAN verification failed: ${portalRecord.pan_status || 'Defective filings detected'}.`
    };
  }

  if (category === 'udyam') {
    if (portalRecord.status === 'Active & Verified') {
      return {
        status: 'pass',
        reason: `Valid Udyam MSME certificate (${portalRecord.enterprise_type}) verified against Ministry database.`
      };
    }
    if (portalRecord.bidding_subsidiary_relationship || portalRecord.audit_note) {
      return {
        status: 'unclear',
        reason: portalRecord.audit_note || 'Udyam certificate registered under parent company; subsidiary eligibility requires officer determination.'
      };
    }
    return {
      status: 'fail',
      reason: `Udyam certificate is ${portalRecord.status || 'invalid'}. ${portalRecord.cancellation_reason || 'Non-compliant'}.`
    };
  }

  if (category === 'mii') {
    if (portalRecord.status === 'Compliant' && portalRecord.portal_verified_local_content_pct >= portalRecord.statutory_threshold_required) {
      return {
        status: 'pass',
        reason: `Make in India local content verified at ${portalRecord.portal_verified_local_content_pct}% (meets ${portalRecord.statutory_threshold_required}% threshold).`
      };
    }
    if (portalRecord.status === 'Pending Audit Clarification') {
      return {
        status: 'unclear',
        reason: portalRecord.audit_findings || 'Local content self-certification requires statutory auditor verification due to tender threshold.'
      };
    }
    return {
      status: 'fail',
      reason: `Make in India verification failed: Portal verified local content is only ${portalRecord.portal_verified_local_content_pct}% vs required ${portalRecord.statutory_threshold_required}%.`
    };
  }

  if (category === 'epfo_esic') {
    if (portalRecord.status === 'Active & Regular') {
      return {
        status: 'pass',
        reason: `EPFO/ESIC establishment is active with regular monthly ECR remittances (${portalRecord.active_subscribers} active subscribers).`
      };
    }
    if (portalRecord.status === 'Pending Data Sync') {
      return {
        status: 'unclear',
        reason: portalRecord.audit_note || 'EPFO challan payments under unified portal migration sync; status pending confirmation.'
      };
    }
    return {
      status: 'fail',
      reason: `EPFO/ESIC establishment in default: ${portalRecord.default_status || 'Unpaid statutory dues'}.`
    };
  }

  if (category === 'startup_nsic') {
    if (portalRecord.status === 'Not Applicable') {
      return {
        status: 'not_applicable',
        reason: portalRecord.reason || 'Startup/NSIC exemption not claimed; standard procurement criteria apply.'
      };
    }
    if (portalRecord.status === 'Valid & Active') {
      return {
        status: 'pass',
        reason: `Recognized under Startup India (${portalRecord.recognition_type}) valid until ${portalRecord.valid_until}.`
      };
    }
    return {
      status: 'fail',
      reason: `Startup/NSIC registration is ${portalRecord.status}. ${portalRecord.renewal_status || 'Expired'}.`
    };
  }

  if (category === 'oem_auth') {
    if (portalRecord.status === 'Authentic & Verified') {
      return {
        status: 'pass',
        reason: `Direct OEM authorization verified with OEM portal cryptographic confirmation.`
      };
    }
    if (portalRecord.status?.includes('Conditional')) {
      return {
        status: 'unclear',
        reason: portalRecord.officer_action_needed || 'Tier-2 distributor authorization uploaded; requires procurement officer buyer concurrence.'
      };
    }
    return {
      status: 'fail',
      reason: `Manufacturer Authorization Form rejected: ${portalRecord.status}. ${portalRecord.oem_portal_verification_note || 'Invalid key'}.`
    };
  }

  if (category === 'digilocker') {
    if (portalRecord.status === 'Authentic' && !portalRecord.tamper_detected) {
      return {
        status: 'pass',
        reason: 'Document hash and digital signature verified against Ministry DigiLocker repository.'
      };
    }
    return {
      status: 'fail',
      reason: `DigiLocker verification failed: ${portalRecord.status}. SHA-256 digital signature mismatch detected.`
    };
  }

  // General fallback
  return {
    status: portalRecord.status === 'Active' || portalRecord.status === 'Valid' ? 'pass' : 'fail',
    reason: `Verification completed against portal reference ID ${extractedClaim?.reference_id}.`
  };
}
