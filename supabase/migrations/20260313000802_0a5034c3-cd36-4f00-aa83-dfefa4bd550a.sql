
-- Add operating hours to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS operating_hours_json jsonb DEFAULT '[]'::jsonb;

-- Create store reviews table
CREATE TABLE public.store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique: one review per customer per store
CREATE UNIQUE INDEX store_reviews_customer_store_unique ON public.store_reviews (store_id, customer_id);

-- Enable RLS
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read approved reviews
CREATE POLICY "Anyone can read approved reviews"
  ON public.store_reviews FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Customers can insert their own reviews
CREATE POLICY "Customers can insert own reviews"
  ON public.store_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews"
  ON public.store_reviews FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );
