import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root or current dir
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const PORT = process.env.PORT || 5000;

export const CATEGORIES = {
  blacklist: { name: 'GeM Debarment / CVC Blacklist', weight: 25, referenceField: 'GSTIN / PAN' },
  gst: { name: 'GSTIN Registration & Filing', weight: 15, referenceField: 'GSTIN' },
  pan_it: { name: 'PAN & Income Tax Compliance', weight: 15, referenceField: 'PAN' },
  udyam: { name: 'MSME / Udyam Registration', weight: 10, referenceField: 'Udyam Registration Number' },
  mii: { name: 'Make in India (Local Content %)', weight: 10, referenceField: 'MII Declaration Ref' },
  epfo_esic: { name: 'EPFO & ESIC Compliance', weight: 10, referenceField: 'EPFO Establishment Code' },
  startup_nsic: { name: 'Startup India / NSIC Recognition', weight: 5, referenceField: 'DPIIT / NSIC Ref' },
  oem_auth: { name: 'OEM Authorization (MAF)', weight: 5, referenceField: 'OEM Auth Code' },
  digilocker: { name: 'DigiLocker Certificate Verification', weight: 5, referenceField: 'DigiLocker URI / Hash' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

// Supabase Setup
export const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SECRET_KEY &&
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
  : null;

// Gemini Setup
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || process.env.LLM_API_KEY?.trim();

export const isGeminiConfigured = Boolean(
  GEMINI_API_KEY &&
  GEMINI_API_KEY.length > 10 &&
  !GEMINI_API_KEY.includes('your-key')
);

export const genAI = isGeminiConfigured
  ? new GoogleGenerativeAI(GEMINI_API_KEY)
  : null;

export function getSystemModeStatus() {
  const isLive = isSupabaseConfigured && isGeminiConfigured;
  return {
    mode: isLive ? 'live' : 'fallback',
    is_live: isLive,
    supabase: {
      status: isSupabaseConfigured ? 'connected' : 'local_fallback',
      url_configured: Boolean(SUPABASE_URL),
    },
    gemini: {
      status: isGeminiConfigured ? 'active' : 'local_fallback',
      key_configured: Boolean(GEMINI_API_KEY),
      model: 'gemini-1.5-flash',
    },
    message: isLive
      ? 'Running in LIVE mode with Supabase PostgreSQL and Google Gemini AI.'
      : 'Running in LOCAL FALLBACK mode (mock portal data and deterministic AI simulator active). Add SUPABASE_URL, SUPABASE_SECRET_KEY, and GEMINI_API_KEY to .env to switch to LIVE.'
  };
}
