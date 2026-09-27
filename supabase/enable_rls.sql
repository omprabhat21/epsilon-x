-- ====================================================================
-- EPSILON X — ROW LEVEL SECURITY (RLS) ACTIVATION SCRIPT
-- Closes Supabase security advisory: "Row-Level Security (RLS) is disabled"
-- ====================================================================

-- 1. Enable RLS on all 5 application tables
ALTER TABLE IF EXISTS public.bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mock_portal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compliance_scores ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS for table owners (ensures consistency)
ALTER TABLE IF EXISTS public.bidders FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mock_portal_records FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_results FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compliance_scores FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- ARCHITECTURAL NOTES:
-- 1. DEFAULT-DENY POLICY:
--    In PostgreSQL / Supabase, enabling RLS without granting permissive
--    policies (CREATE POLICY ... TO anon / authenticated) results in an
--    automatic DEFAULT-DENY for any client using the public/anon key.
--
-- 2. ZERO IMPACT ON APPLICATION:
--    The Epsilon X React frontend never communicates with Supabase directly.
--    All API traffic routes through our Node.js Express backend, which
--    authenticates using SUPABASE_SECRET_KEY (service_role).
--    The service_role in Supabase has the BYPASSRLS attribute, meaning all
--    server queries, insertions, and updates continue to execute with full
--    privileges while public/anon access is completely locked down.
-- ====================================================================
