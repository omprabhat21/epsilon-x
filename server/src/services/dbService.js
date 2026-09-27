import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_DATA_PATH = path.resolve(__dirname, '../../../data/mock-portal-data.json');

// Local in-memory store for fallback mode
const localStore = {
  bidders: [],
  documents: [],
  mock_portal_records: [],
  verification_results: [],
  compliance_scores: [],
  bid_history: [],
};

// Load initial mock portal data into local store
export function loadMockDataFromFile() {
  try {
    if (fs.existsSync(MOCK_DATA_PATH)) {
      const content = fs.readFileSync(MOCK_DATA_PATH, 'utf-8');
      const data = JSON.parse(content);
      
      // Load bidders
      if (data.bidder_profiles) {
        localStore.bidders = data.bidder_profiles.map(b => ({
          id: b.id,
          name: b.name,
          profile_key: b.profile_key,
          pan: b.pan,
          gstin: b.gstin,
          udyam: b.udyam,
          description: b.description,
          created_at: new Date().toISOString()
        }));
      }

      // Load portal records
      localStore.mock_portal_records = [];
      if (data.portal_records) {
        for (const [category, records] of Object.entries(data.portal_records)) {
          for (const rec of records) {
            localStore.mock_portal_records.push({
              id: uuidv4(),
              category,
              reference_id: rec.reference_id,
              field_data: rec,
              bidder_profile: rec.bidder_profile,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      // Load bid history
      localStore.bid_history = [];
      if (data.bid_history) {
        localStore.bid_history = data.bid_history.map(h => ({
          id: h.id || uuidv4(),
          bidder_id: h.bidder_id,
          tender_ref: h.tender_ref,
          score: Number(h.score),
          risk_level: h.risk_level,
          officer_decision: h.officer_decision,
          date: h.date,
          created_at: h.created_at || new Date().toISOString()
        }));
      }

      console.log(`[Database] Loaded ${localStore.bidders.length} demo bidders, ${localStore.mock_portal_records.length} portal records, and ${localStore.bid_history.length} bid history entries.`);
    }
  } catch (err) {
    console.error('[Database] Failed loading mock portal data file:', err.message);
  }
}

// Initial load
loadMockDataFromFile();

// ===================== BIDDERS =====================

export async function getBidders() {
  const demoBidders = localStore.bidders;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('bidders').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const customBidders = data.filter(b => !demoBidders.some(d => d.id === b.id || d.name === b.name));
        return [...demoBidders, ...customBidders];
      }
    } catch (e) {
      console.warn('[Database] Supabase getBidders failed, using local store:', e.message);
    }
  }
  return demoBidders;
}

export async function getBidderById(id) {
  const demoMatch = localStore.bidders.find(b => b.id === id);
  if (demoMatch) return demoMatch;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('bidders').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn('[Database] Supabase getBidderById failed, using local store:', e.message);
    }
  }
  return localStore.bidders.find(b => b.id === id) || null;
}

export async function createBidder(name, profile_key = null) {
  const newBidder = {
    id: uuidv4(),
    name,
    profile_key: profile_key || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('bidders').insert([newBidder]).select().single();
      if (!error && data) {
        localStore.bidders.unshift(data);
        return data;
      }
    } catch (e) {
      console.warn('[Database] Supabase createBidder failed, using local store:', e.message);
    }
  }

  localStore.bidders.unshift(newBidder);
  return newBidder;
}

export async function deleteBidder(bidderId) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('bid_history').delete().eq('bidder_id', bidderId);
      await supabase.from('compliance_scores').delete().eq('bidder_id', bidderId);
      await supabase.from('verification_results').delete().eq('bidder_id', bidderId);
      await supabase.from('documents').delete().eq('bidder_id', bidderId);
      await supabase.from('bidders').delete().eq('id', bidderId);
    } catch (e) {
      console.warn('[Database] Supabase deleteBidder failed:', e.message);
    }
  }

  localStore.bidders = localStore.bidders.filter(b => b.id !== bidderId);
  localStore.compliance_scores = localStore.compliance_scores.filter(s => s.bidder_id !== bidderId);
  localStore.verification_results = localStore.verification_results.filter(v => v.bidder_id !== bidderId);
  localStore.documents = localStore.documents.filter(d => d.bidder_id !== bidderId);
  localStore.bid_history = localStore.bid_history.filter(h => h.bidder_id !== bidderId);

  return { success: true, id: bidderId };
}

// ===================== DOCUMENTS =====================

export async function getDocumentsByBidder(bidderId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('documents').select('*').eq('bidder_id', bidderId).order('uploaded_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('[Database] Supabase getDocumentsByBidder failed, using local store:', e.message);
    }
  }
  return localStore.documents.filter(d => d.bidder_id === bidderId);
}

export async function createDocument({ bidder_id, doc_type, file_url, raw_text }) {
  const newDoc = {
    id: uuidv4(),
    bidder_id,
    doc_type,
    file_url: file_url || null,
    raw_text,
    uploaded_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('documents').insert([newDoc]).select().single();
      if (!error && data) {
        // replace any existing doc for this category or append
        localStore.documents = localStore.documents.filter(d => !(d.bidder_id === bidder_id && d.doc_type === doc_type));
        localStore.documents.push(data);
        return data;
      }
    } catch (e) {
      console.warn('[Database] Supabase createDocument failed, using local store:', e.message);
    }
  }

  localStore.documents = localStore.documents.filter(d => !(d.bidder_id === bidder_id && d.doc_type === doc_type));
  localStore.documents.push(newDoc);
  return newDoc;
}

// ===================== MOCK PORTAL RECORDS =====================

export async function getPortalRecord(category, referenceId) {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('mock_portal_records').select('*').eq('category', category);
      if (referenceId) {
        query = query.eq('reference_id', referenceId);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) return data.field_data;
    } catch (e) {
      console.warn('[Database] Supabase getPortalRecord failed, using local store:', e.message);
    }
  }

  // Local lookup: check exact match or fallback to bidder profile match
  const found = localStore.mock_portal_records.find(r => 
    r.category === category && (r.reference_id === referenceId || !referenceId)
  );
  return found ? found.field_data : null;
}

export async function getPortalRecordByProfile(category, profileKey) {
  const found = localStore.mock_portal_records.find(r => 
    r.category === category && r.bidder_profile === profileKey
  );
  return found ? found.field_data : null;
}

export async function getAllMockRecords() {
  return localStore.mock_portal_records;
}

// ===================== VERIFICATION RESULTS =====================

export async function getVerificationResults(bidderId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('verification_results').select('*').eq('bidder_id', bidderId);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('[Database] Supabase getVerificationResults failed, using local store:', e.message);
    }
  }
  return localStore.verification_results.filter(v => v.bidder_id === bidderId);
}

export async function saveVerificationResult({ bidder_id, category, status, reason, extracted_claim, matched_record }) {
  const result = {
    id: uuidv4(),
    bidder_id,
    category,
    status,
    reason,
    extracted_claim,
    matched_record,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // Upsert or insert
      const { data, error } = await supabase.from('verification_results').insert([result]).select().single();
      if (!error && data) {
        localStore.verification_results = localStore.verification_results.filter(
          v => !(v.bidder_id === bidder_id && v.category === category)
        );
        localStore.verification_results.push(data);
        return data;
      }
    } catch (e) {
      console.warn('[Database] Supabase saveVerificationResult failed, using local store:', e.message);
    }
  }

  localStore.verification_results = localStore.verification_results.filter(
    v => !(v.bidder_id === bidder_id && v.category === category)
  );
  localStore.verification_results.push(result);
  return result;
}

// ===================== COMPLIANCE SCORES =====================

export function parseComplianceScoreRecord(record) {
  if (!record) return null;
  let ai_audit_summary = record.ai_audit_summary || null;
  let officer_override = record.officer_override ?? false;
  let officer_name = record.officer_name || null;
  let rawNote = record.officer_note || '';

  if (rawNote) {
    const summaryMatch = rawNote.match(/\[AI_AUDIT_SUMMARY:\s*([\s\S]*?)\]/);
    if (summaryMatch && !ai_audit_summary) {
      ai_audit_summary = summaryMatch[1].trim();
    }
    const overrideMatch = rawNote.match(/\[OFFICER_OVERRIDE:\s*(true|false)\]/i);
    if (overrideMatch && record.officer_override === undefined) {
      officer_override = overrideMatch[1].toLowerCase() === 'true';
    }
    const officerMatch = rawNote.match(/\[Adjudicated by:\s*([^\]]+)\]/);
    if (officerMatch && !officer_name) {
      officer_name = officerMatch[1].trim();
    }
  }

  return {
    ...record,
    officer_name,
    officer_override: Boolean(officer_override),
    ai_audit_summary,
  };
}

export async function getComplianceScore(bidderId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('compliance_scores').select('*').eq('bidder_id', bidderId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!error && data) {
        // Also look up local store to preserve in-memory officer attribution/override if available
        const localMatch = localStore.compliance_scores.find(s => s.bidder_id === bidderId);
        return parseComplianceScoreRecord({
          ...data,
          officer_override: localMatch?.officer_override !== undefined ? localMatch.officer_override : data.officer_override,
          ai_audit_summary: localMatch?.ai_audit_summary || data.ai_audit_summary,
          officer_name: localMatch?.officer_name || data.officer_name,
        });
      }
    } catch (e) {
      console.warn('[Database] Supabase getComplianceScore failed, using local store:', e.message);
    }
  }
  const scores = localStore.compliance_scores.filter(s => s.bidder_id === bidderId);
  return scores.length > 0 ? parseComplianceScoreRecord(scores[scores.length - 1]) : null;
}

export async function saveComplianceScore({ bidder_id, overall_score, risk_level, officer_decision, officer_note, ai_audit_summary, officer_override }) {
  const record = {
    id: uuidv4(),
    bidder_id,
    overall_score,
    risk_level,
    officer_decision: officer_decision || null,
    officer_note: officer_note || null,
    ai_audit_summary: ai_audit_summary || null,
    officer_override: Boolean(officer_override),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // First try inserting with full schema
      const { data, error } = await supabase.from('compliance_scores').insert([record]).select().single();
      if (!error && data) {
        localStore.compliance_scores.push({ ...record, ...data });
        return parseComplianceScoreRecord({ ...record, ...data });
      }
      // If error might be missing column, retry without extended columns
      if (error) {
        const fallbackRecord = {
          id: record.id,
          bidder_id: record.bidder_id,
          overall_score: record.overall_score,
          risk_level: record.risk_level,
          officer_decision: record.officer_decision,
          officer_note: record.officer_note,
          created_at: record.created_at,
        };
        const { data: fbData, error: fbError } = await supabase.from('compliance_scores').insert([fallbackRecord]).select().single();
        if (!fbError && fbData) {
          localStore.compliance_scores.push(record);
          return parseComplianceScoreRecord(record);
        }
      }
    } catch (e) {
      console.warn('[Database] Supabase saveComplianceScore failed, using local store:', e.message);
    }
  }

  localStore.compliance_scores.push(record);
  return parseComplianceScoreRecord(record);
}

export async function updateOfficerDecision(bidderId, officer_decision, officer_note, officer_name = null, ai_audit_summary = null, officer_override = false) {
  const now = new Date().toISOString();

  let formattedNote = officer_note || '';
  if (officer_name && formattedNote && !formattedNote.includes('[Adjudicated by:')) {
    formattedNote = `[Adjudicated by: ${officer_name}] ${formattedNote}`.trim();
  } else if (officer_name && !formattedNote) {
    formattedNote = `[Adjudicated by: ${officer_name}] Statutory determination recorded.`;
  }

  // Embed tags into formatted note for guaranteed persistence across schema differences
  if (ai_audit_summary && !formattedNote.includes('[AI_AUDIT_SUMMARY:')) {
    formattedNote = `${formattedNote}\n[AI_AUDIT_SUMMARY: ${ai_audit_summary}]`.trim();
  }
  if (officer_override !== undefined && officer_override !== null && !formattedNote.includes('[OFFICER_OVERRIDE:')) {
    formattedNote = `${formattedNote}\n[OFFICER_OVERRIDE: ${Boolean(officer_override)}]`.trim();
  }

  const inMemoryUpdated = {
    id: uuidv4(),
    bidder_id: bidderId,
    overall_score: 0,
    risk_level: 'high',
    officer_decision,
    officer_note: formattedNote,
    officer_name: officer_name || null,
    ai_audit_summary: ai_audit_summary || null,
    officer_override: Boolean(officer_override),
    created_at: now,
  };

  const existing = await getComplianceScore(bidderId);
  if (existing) {
    inMemoryUpdated.id = existing.id;
    inMemoryUpdated.overall_score = existing.overall_score;
    inMemoryUpdated.risk_level = existing.risk_level;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try updating with full columns
      let updatePayload = {
        officer_decision,
        officer_note: formattedNote,
        ai_audit_summary,
        officer_override: Boolean(officer_override),
        created_at: now,
      };

      let { data, error } = await supabase
        .from('compliance_scores')
        .update(updatePayload)
        .eq('bidder_id', bidderId)
        .select();

      if (error && error.message && error.message.includes('column')) {
        // Fallback: update standard columns without extended columns
        updatePayload = {
          officer_decision,
          officer_note: formattedNote,
          created_at: now,
        };
        const retryRes = await supabase
          .from('compliance_scores')
          .update(updatePayload)
          .eq('bidder_id', bidderId)
          .select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && data && data.length > 0) {
        const updated = {
          ...data[0],
          officer_name,
          ai_audit_summary,
          officer_override: Boolean(officer_override),
        };
        localStore.compliance_scores = localStore.compliance_scores.filter(s => s.bidder_id !== bidderId);
        localStore.compliance_scores.push(updated);
        return parseComplianceScoreRecord(updated);
      }

      // If no row existed in Supabase, insert
      const newRec = {
        id: inMemoryUpdated.id,
        bidder_id: bidderId,
        overall_score: inMemoryUpdated.overall_score,
        risk_level: inMemoryUpdated.risk_level,
        officer_decision,
        officer_note: formattedNote,
        created_at: now,
      };
      const { data: inserted } = await supabase
        .from('compliance_scores')
        .insert([newRec])
        .select()
        .single();

      if (inserted) {
        const withOfficer = {
          ...inserted,
          officer_name,
          ai_audit_summary,
          officer_override: Boolean(officer_override),
        };
        localStore.compliance_scores = localStore.compliance_scores.filter(s => s.bidder_id !== bidderId);
        localStore.compliance_scores.push(withOfficer);
        return parseComplianceScoreRecord(withOfficer);
      }
    } catch (e) {
      console.warn('[Database] Supabase updateOfficerDecision failed, using local store:', e.message);
    }
  }

  localStore.compliance_scores = localStore.compliance_scores.filter(s => s.bidder_id !== bidderId);
  localStore.compliance_scores.push(inMemoryUpdated);
  return parseComplianceScoreRecord(inMemoryUpdated);
}

// ===================== BID HISTORY =====================

export async function getBidHistory(bidderId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bid_history')
        .select('*')
        .eq('bidder_id', bidderId)
        .order('date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('[Database] Supabase getBidHistory failed, using local store:', e.message);
    }
  }

  return localStore.bid_history
    .filter(h => h.bidder_id === bidderId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getAllBidHistory() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bid_history')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('[Database] Supabase getAllBidHistory failed, using local store:', e.message);
    }
  }
  return localStore.bid_history;
}

export async function createBidHistoryEntry({ bidder_id, tender_ref, score, risk_level, officer_decision, date }) {
  const entry = {
    id: uuidv4(),
    bidder_id,
    tender_ref,
    score: Number(score),
    risk_level,
    officer_decision,
    date,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('bid_history').insert([entry]).select().single();
      if (!error && data) {
        localStore.bid_history.unshift(data);
        return data;
      }
    } catch (e) {
      console.warn('[Database] Supabase createBidHistoryEntry failed, using local store:', e.message);
    }
  }

  localStore.bid_history.unshift(entry);
  return entry;
}

