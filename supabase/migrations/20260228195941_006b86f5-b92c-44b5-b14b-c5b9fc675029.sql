
-- Phase 1: Extend offers table for store coupon wizard

-- Add new columns to offers table
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS coupon_type text DEFAULT 'STORE',
  ADD COLUMN IF NOT EXISTS coupon_category text,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scaled_values_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS requires_scheduling boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduling_advance_hours integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_cumulative boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS specific_days_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS max_total_uses integer,
  ADD COLUMN IF NOT EXISTS max_uses_per_customer integer,
  ADD COLUMN IF NOT EXISTS interval_between_uses_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redemption_type text DEFAULT 'PRESENCIAL',
  ADD COLUMN IF NOT EXISTS redemption_branch_id uuid REFERENCES public.branches(id),
  ADD COLUMN IF NOT EXISTS terms_text text,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.store_catalog_items(id);

-- Add index for coupon_type filtering
CREATE INDEX IF NOT EXISTS idx_offers_coupon_type ON public.offers(coupon_type);

-- Add index for product-specific coupons
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON public.offers(product_id);

-- Add RLS policy for store owners to manage their own offers
CREATE POLICY "Store owners manage own offers"
  ON public.offers
  FOR ALL
  USING (
    store_id IN (
      SELECT s.id FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT s.id FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
    )
  );
