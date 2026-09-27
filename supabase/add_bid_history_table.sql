-- ====================================================================
-- EPSILON X — BID HISTORY & RELIABILITY SCORE MIGRATION SCRIPT
-- Adds public.bid_history table for tracking past tender bids
-- Purely informational under GFR Rule 149 (Does not alter compliance score)
-- ====================================================================

-- 1. Create the bid_history table
CREATE TABLE IF NOT EXISTS public.bid_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_id UUID NOT NULL REFERENCES public.bidders(id) ON DELETE CASCADE,
    tender_ref VARCHAR(100) NOT NULL,
    score NUMERIC NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    officer_decision VARCHAR(20) NOT NULL CHECK (officer_decision IN ('qualified', 'disqualified')),
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index on bidder_id and date for fast lookups
CREATE INDEX IF NOT EXISTS idx_bid_history_bidder_id ON public.bid_history (bidder_id);
CREATE INDEX IF NOT EXISTS idx_bid_history_date ON public.bid_history (date DESC);

-- 3. Enable and enforce Row Level Security (RLS)
ALTER TABLE IF EXISTS public.bid_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bid_history FORCE ROW LEVEL SECURITY;

-- 4. Comments for data dictionary
COMMENT ON TABLE public.bid_history IS 'Historical log of past tender bids and officer adjudications for computing Bidder Reliability Score';
COMMENT ON COLUMN public.bid_history.tender_ref IS 'GeM / sovereign tender reference identifier (e.g., GEM/2025/B/492104)';
COMMENT ON COLUMN public.bid_history.score IS 'Historical overall compliance score awarded in past tender';
COMMENT ON COLUMN public.bid_history.risk_level IS 'Historical risk level assessment (low, medium, high)';
COMMENT ON COLUMN public.bid_history.officer_decision IS 'Historical statutory officer determination (qualified or disqualified)';
COMMENT ON COLUMN public.bid_history.date IS 'Date of past tender adjudication';

-- 5. Seed historical entries for the 3 baseline bidders
-- Note: ON CONFLICT DO NOTHING ensures safe re-execution
INSERT INTO public.bid_history (id, bidder_id, tender_ref, score, risk_level, officer_decision, date)
VALUES
    -- Fully Compliant Co. (b1111111-1111-1111-1111-111111111111): 3 bids, 3 Qualified (100% Reliability)
    ('h1111111-1111-1111-1111-111111111101', 'b1111111-1111-1111-1111-111111111111', 'GEM/2025/B/492104', 96, 'low', 'qualified', '2025-08-14'),
    ('h1111111-1111-1111-1111-111111111102', 'b1111111-1111-1111-1111-111111111111', 'GEM/2025/B/583920', 92, 'low', 'qualified', '2025-11-22'),
    ('h1111111-1111-1111-1111-111111111103', 'b1111111-1111-1111-1111-111111111111', 'GEM/2026/B/721498', 98, 'low', 'qualified', '2026-02-18'),

    -- Non-Compliant Traders (b2222222-2222-2222-2222-222222222222): 3 bids, 1 Qualified, 2 Disqualified (33% Reliability)
    ('h2222222-2222-2222-2222-222222222201', 'b2222222-2222-2222-2222-222222222222', 'GEM/2024/B/319402', 78, 'medium', 'qualified', '2024-10-10'),
    ('h2222222-2222-2222-2222-222222222202', 'b2222222-2222-2222-2222-222222222222', 'GEM/2025/B/511687', 38, 'high', 'disqualified', '2025-04-02'),
    ('h2222222-2222-2222-2222-222222222203', 'b2222222-2222-2222-2222-222222222222', 'GEM/2025/B/789123', 24, 'high', 'disqualified', '2025-11-18'),

    -- Ambiguous Enterprises (b3333333-3333-3333-3333-333333333333): 3 bids, 2 Qualified, 1 Disqualified (67% Reliability)
    ('h3333333-3333-3333-3333-333333333301', 'b3333333-3333-3333-3333-333333333333', 'GEM/2024/B/288190', 85, 'low', 'qualified', '2024-11-30'),
    ('h3333333-3333-3333-3333-333333333302', 'b3333333-3333-3333-3333-333333333333', 'GEM/2025/B/472819', 58, 'medium', 'disqualified', '2025-05-16'),
    ('h3333333-3333-3333-3333-333333333303', 'b3333333-3333-3333-3333-333333333333', 'GEM/2026/B/681023', 74, 'medium', 'qualified', '2026-01-20')
ON CONFLICT (id) DO NOTHING;
