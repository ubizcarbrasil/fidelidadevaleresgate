
-- 1. Add columns to store_catalog_items
ALTER TABLE public.store_catalog_items
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS brand_id uuid,
  ADD COLUMN IF NOT EXISTS branch_id uuid;

-- Backfill brand_id and branch_id from the related store
UPDATE public.store_catalog_items sci
SET brand_id = s.brand_id, branch_id = s.branch_id
FROM public.stores s
WHERE sci.store_id = s.id AND sci.brand_id IS NULL;

-- Now make them NOT NULL
ALTER TABLE public.store_catalog_items
  ALTER COLUMN brand_id SET NOT NULL,
  ALTER COLUMN branch_id SET NOT NULL;

-- Add FKs
ALTER TABLE public.store_catalog_items
  ADD CONSTRAINT store_catalog_items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  ADD CONSTRAINT store_catalog_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);

-- Add store_catalog_config_json to stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS store_catalog_config_json jsonb DEFAULT '{}'::jsonb;

-- 2. Create store_catalog_categories
CREATE TABLE public.store_catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_catalog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active catalog categories"
  ON public.store_catalog_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Store owners manage own catalog categories"
  ON public.store_catalog_categories FOR ALL
  USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));

CREATE POLICY "Brand/branch admins manage catalog categories"
  ON public.store_catalog_categories FOR ALL
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  );

-- 3. Create catalog_cart_orders
CREATE TABLE public.catalog_cart_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id),
  customer_id uuid REFERENCES public.customers(id),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  points_earned_estimate integer NOT NULL DEFAULT 0,
  whatsapp_url_sent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_cart_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert cart orders"
  ON public.catalog_cart_orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Customers read own cart orders"
  ON public.catalog_cart_orders FOR SELECT
  USING (
    customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid())
  );

CREATE POLICY "Store owners read own store cart orders"
  ON public.catalog_cart_orders FOR SELECT
  USING (
    store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

CREATE POLICY "Admin read cart orders"
  ON public.catalog_cart_orders FOR SELECT
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  );

-- 4. Update RLS on store_catalog_items to include store owner policy
CREATE POLICY "Store owners manage own catalog items"
  ON public.store_catalog_items FOR ALL
  USING (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid()));
