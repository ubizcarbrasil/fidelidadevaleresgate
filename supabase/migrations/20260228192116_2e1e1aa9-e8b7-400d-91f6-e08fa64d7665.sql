
-- Table for affiliate marketplace deals ("Achadinhos")
CREATE TABLE public.affiliate_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  affiliate_url text NOT NULL,
  store_name text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_deals ENABLE ROW LEVEL SECURITY;

-- Anyone can read active deals
CREATE POLICY "Anon read active affiliate deals"
  ON public.affiliate_deals FOR SELECT
  USING (is_active = true);

-- Admins manage deals
CREATE POLICY "Admin manage affiliate deals"
  ON public.affiliate_deals FOR ALL
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR user_has_permission(auth.uid(), 'offers.create'::text)
    AND (
      brand_id IN (SELECT get_user_brand_ids(auth.uid()))
      OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    )
  );

-- Tracking table for affiliate clicks
CREATE TABLE public.affiliate_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES public.affiliate_deals(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert clicks
CREATE POLICY "Insert affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- Admins can read clicks
CREATE POLICY "Admin read affiliate clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR deal_id IN (
      SELECT ad.id FROM affiliate_deals ad
      WHERE ad.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    )
  );

-- Trigger to increment click_count
CREATE OR REPLACE FUNCTION public.increment_affiliate_click_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_deals SET click_count = click_count + 1 WHERE id = NEW.deal_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_affiliate_clicks
  AFTER INSERT ON public.affiliate_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_affiliate_click_count();

-- Updated_at trigger
CREATE TRIGGER update_affiliate_deals_updated_at
  BEFORE UPDATE ON public.affiliate_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
