
-- Sprint A: Add snapshot columns for historical integrity

-- 1. Add offer_snapshot_json and credit_value_applied to redemptions
ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS offer_snapshot_json jsonb,
  ADD COLUMN IF NOT EXISTS credit_value_applied numeric;

-- 2. Add rule_snapshot_json to earning_events
ALTER TABLE public.earning_events
  ADD COLUMN IF NOT EXISTS rule_snapshot_json jsonb;

-- 3. Add terms_version to offers (Sprint D item, but low-cost to add now)
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS terms_version text;
