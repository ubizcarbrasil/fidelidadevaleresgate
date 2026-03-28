
-- Add redeemable fields to affiliate_deals
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS is_redeemable boolean DEFAULT false;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS redeem_points_cost integer DEFAULT null;

-- Create product_redemption_orders table
CREATE TABLE IF NOT EXISTS product_redemption_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  branch_id uuid REFERENCES branches(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  deal_id uuid NOT NULL REFERENCES affiliate_deals(id),
  deal_snapshot_json jsonb NOT NULL DEFAULT '{}',
  affiliate_url text NOT NULL,
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_cpf text,
  delivery_cep text NOT NULL,
  delivery_address text NOT NULL,
  delivery_number text NOT NULL,
  delivery_complement text,
  delivery_neighborhood text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  admin_notes text,
  tracking_code text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_redemption_orders ENABLE ROW LEVEL SECURITY;

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_redemption_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'REJECTED') THEN
    RAISE EXCEPTION 'status must be PENDING, APPROVED, SHIPPED, DELIVERED, or REJECTED';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_redemption_order_status
BEFORE INSERT OR UPDATE ON product_redemption_orders
FOR EACH ROW EXECUTE FUNCTION validate_redemption_order_status();

-- RLS: customers can insert their own orders
CREATE POLICY "Customers can insert own redemption orders"
ON product_redemption_orders FOR INSERT TO authenticated
WITH CHECK (customer_id IN (SELECT get_own_customer_ids(auth.uid())));

-- RLS: customers can view their own orders
CREATE POLICY "Customers can view own redemption orders"
ON product_redemption_orders FOR SELECT TO authenticated
USING (customer_id IN (SELECT get_own_customer_ids(auth.uid())));

-- RLS: brand admins can view orders for their brand
CREATE POLICY "Brand admins can view brand redemption orders"
ON product_redemption_orders FOR SELECT TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())));

-- RLS: brand admins can update orders for their brand
CREATE POLICY "Brand admins can update brand redemption orders"
ON product_redemption_orders FOR UPDATE TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())));
