
-- Create customer_favorite_stores table
CREATE TABLE public.customer_favorite_stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id, store_id)
);

-- Enable RLS
ALTER TABLE public.customer_favorite_stores ENABLE ROW LEVEL SECURITY;

-- Customers can read their own favorite stores
CREATE POLICY "Select own favorite stores"
ON public.customer_favorite_stores
FOR SELECT
USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- Customers can insert their own favorite stores
CREATE POLICY "Insert own favorite stores"
ON public.customer_favorite_stores
FOR INSERT
WITH CHECK (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- Customers can delete their own favorite stores
CREATE POLICY "Delete own favorite stores"
ON public.customer_favorite_stores
FOR DELETE
USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- Admin read
CREATE POLICY "Admin read favorite stores"
ON public.customer_favorite_stores
FOR SELECT
USING (user_has_permission(auth.uid(), 'customers.read'::text));
