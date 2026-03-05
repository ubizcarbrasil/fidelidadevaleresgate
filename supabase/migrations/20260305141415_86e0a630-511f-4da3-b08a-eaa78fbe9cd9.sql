
-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  offer_id uuid REFERENCES public.offers(id),
  type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  code text NOT NULL DEFAULT upper(substr(gen_random_uuid()::text, 1, 8)),
  status text NOT NULL DEFAULT 'ACTIVE',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_coupon_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.type NOT IN ('PERCENT', 'FIXED') THEN
    RAISE EXCEPTION 'coupon type must be PERCENT or FIXED';
  END IF;
  IF NEW.status NOT IN ('ACTIVE', 'INACTIVE', 'EXPIRED') THEN
    RAISE EXCEPTION 'coupon status must be ACTIVE, INACTIVE, or EXPIRED';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coupon
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.validate_coupon_fields();

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin console access
CREATE POLICY "Admin read coupons" ON public.coupons FOR SELECT
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "Store owners manage own coupons" ON public.coupons FOR ALL
  USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));

CREATE POLICY "Brand admins manage coupons" ON public.coupons FOR ALL
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  )
  WITH CHECK (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );
