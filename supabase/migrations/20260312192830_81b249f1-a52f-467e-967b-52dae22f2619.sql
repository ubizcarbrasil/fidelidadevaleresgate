
-- Create affiliate deal categories table
CREATE TABLE public.affiliate_deal_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#6366f1',
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.affiliate_deal_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
  ON public.affiliate_deal_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON public.affiliate_deal_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default categories (will be copied per brand when needed)
-- We'll insert them as a "template" brand_id = '00000000-0000-0000-0000-000000000000'
-- Actually, better to seed per brand. Let's create a function instead.

-- Add category_id to affiliate_deals
ALTER TABLE public.affiliate_deals ADD COLUMN category_id UUID REFERENCES public.affiliate_deal_categories(id) ON DELETE SET NULL;

-- Index
CREATE INDEX idx_affiliate_deal_categories_brand ON public.affiliate_deal_categories(brand_id);
CREATE INDEX idx_affiliate_deals_category_id ON public.affiliate_deals(category_id);
