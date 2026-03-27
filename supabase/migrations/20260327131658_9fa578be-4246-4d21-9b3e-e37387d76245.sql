
-- Migration 1: Add governance columns to affiliate_deals
ALTER TABLE public.affiliate_deals
  ADD COLUMN IF NOT EXISTS source_group_id TEXT,
  ADD COLUMN IF NOT EXISTS source_group_name TEXT,
  ADD COLUMN IF NOT EXISTS marketplace TEXT,
  ADD COLUMN IF NOT EXISTS current_status TEXT NOT NULL DEFAULT 'active';

-- Index for governance queries
CREATE INDEX IF NOT EXISTS idx_affiliate_deals_current_status ON public.affiliate_deals(current_status);
CREATE INDEX IF NOT EXISTS idx_affiliate_deals_source_group ON public.affiliate_deals(origin, source_group_id);
