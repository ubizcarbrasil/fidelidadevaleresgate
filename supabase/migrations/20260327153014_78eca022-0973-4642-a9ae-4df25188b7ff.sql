
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS external_driver_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_brand_external_driver 
  ON public.customers(brand_id, external_driver_id) 
  WHERE external_driver_id IS NOT NULL;
