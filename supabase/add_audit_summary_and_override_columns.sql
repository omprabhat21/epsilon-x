-- ====================================================================
-- EPSILON X — AUDIT SUMMARY & OFFICER OVERRIDE MIGRATION SCRIPT
-- Adds columns to compliance_scores for transparent officer adjudication
-- ====================================================================

-- 1. Add officer_override boolean flag (default false)
ALTER TABLE IF EXISTS public.compliance_scores 
ADD COLUMN IF NOT EXISTS officer_override BOOLEAN DEFAULT FALSE;

-- 2. Add ai_audit_summary text column
ALTER TABLE IF EXISTS public.compliance_scores 
ADD COLUMN IF NOT EXISTS ai_audit_summary TEXT;

-- 3. Document table columns
COMMENT ON COLUMN public.compliance_scores.officer_override IS 'Flag indicating whether human procurement officer determination diverged from AI statutory recommendation';
COMMENT ON COLUMN public.compliance_scores.ai_audit_summary IS 'Auto-compiled statutory findings summary of failed/unclear verification checks shown to officer prior to determination';
