
-- Create customer_favorites table
CREATE TABLE public.customer_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, offer_id)
);

-- Enable RLS
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Customers can view their own favorites
CREATE POLICY "Select own favorites"
ON public.customer_favorites
FOR SELECT
USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- Customers can insert their own favorites
CREATE POLICY "Insert own favorites"
ON public.customer_favorites
FOR INSERT
WITH CHECK (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- Customers can delete their own favorites
CREATE POLICY "Delete own favorites"
ON public.customer_favorites
FOR DELETE
USING (customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- Admins can read all favorites
CREATE POLICY "Admin read favorites"
ON public.customer_favorites
FOR SELECT
USING (user_has_permission(auth.uid(), 'customers.read'));

-- Index for performance
CREATE INDEX idx_customer_favorites_customer ON public.customer_favorites(customer_id);
CREATE INDEX idx_customer_favorites_offer ON public.customer_favorites(offer_id);
