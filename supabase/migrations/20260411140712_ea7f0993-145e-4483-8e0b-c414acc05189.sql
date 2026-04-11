-- 1. Add redeemable_by to affiliate_deals
ALTER TABLE public.affiliate_deals
ADD COLUMN IF NOT EXISTS redeemable_by text NOT NULL DEFAULT 'driver';

-- Migrate existing redeemable deals to 'driver'
UPDATE public.affiliate_deals SET redeemable_by = 'driver' WHERE is_redeemable = true AND redeemable_by = 'driver';

-- 2. Add order_source to product_redemption_orders
ALTER TABLE public.product_redemption_orders
ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'driver';

-- 3. Validation trigger for redeemable_by
CREATE OR REPLACE FUNCTION public.validate_redeemable_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.redeemable_by NOT IN ('driver', 'customer', 'both') THEN
    RAISE EXCEPTION 'redeemable_by must be driver, customer, or both';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_redeemable_by
BEFORE INSERT OR UPDATE ON public.affiliate_deals
FOR EACH ROW EXECUTE FUNCTION public.validate_redeemable_by();

-- 4. Validation trigger for order_source
CREATE OR REPLACE FUNCTION public.validate_order_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_source NOT IN ('driver', 'customer') THEN
    RAISE EXCEPTION 'order_source must be driver or customer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order_source
BEFORE INSERT OR UPDATE ON public.product_redemption_orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_source();

-- 5. Insert module definition
INSERT INTO public.module_definitions (key, name, description, category, is_core, customer_facing)
VALUES ('customer_product_redeem', 'Resgate de Produtos (Cliente)', 'Permite que clientes resgatem produtos usando pontos acumulados', 'fidelidade', false, true)
ON CONFLICT (key) DO NOTHING;