
-- Add new fields to vouchers for the 11-step wizard
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'PERCENT',
  ADD COLUMN IF NOT EXISTS discount_fixed_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_purchase numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_uses_per_customer integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS terms text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_audience text NOT NULL DEFAULT 'ALL';
