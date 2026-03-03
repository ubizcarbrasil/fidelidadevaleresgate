
-- 1. Add cpf to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 2. Add columns to catalog_cart_orders
ALTER TABLE public.catalog_cart_orders 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_cpf TEXT,
  ADD COLUMN IF NOT EXISTS points_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Add half portion support to store_catalog_items
ALTER TABLE public.store_catalog_items 
  ADD COLUMN IF NOT EXISTS allow_half BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS half_price NUMERIC;

-- 4. RLS: Allow store owners to UPDATE catalog_cart_orders (confirm points)
CREATE POLICY "Store owners update own store cart orders"
ON public.catalog_cart_orders
FOR UPDATE
USING (
  store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
);

-- 5. RLS: Allow admins to UPDATE catalog_cart_orders
CREATE POLICY "Admin update cart orders"
ON public.catalog_cart_orders
FOR UPDATE
USING (
  has_role(auth.uid(), 'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);

-- 6. Enable realtime for catalog_cart_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_cart_orders;
