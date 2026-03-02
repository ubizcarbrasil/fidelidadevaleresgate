
-- Create store_products table for partner product catalog
CREATE TABLE public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Anon/public read active products
CREATE POLICY "Anon read active store products"
  ON public.store_products FOR SELECT
  USING (is_active = true);

-- Admin read all products within their scope
CREATE POLICY "Admin read store products"
  ON public.store_products FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  );

-- Insert products (brand/branch admins + store owners)
CREATE POLICY "Insert store products"
  ON public.store_products FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    OR store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

-- Update products
CREATE POLICY "Update store products"
  ON public.store_products FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    OR store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

-- Delete products
CREATE POLICY "Delete store products"
  ON public.store_products FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    OR store_id IN (SELECT s.id FROM stores s WHERE s.owner_user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_store_products_store_id ON public.store_products(store_id);
CREATE INDEX idx_store_products_branch_id ON public.store_products(branch_id);
CREATE INDEX idx_store_products_brand_id ON public.store_products(brand_id);
