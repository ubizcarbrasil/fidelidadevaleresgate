
ALTER TABLE public.affiliate_deals ADD COLUMN IF NOT EXISTS store_logo_url text;
ALTER TABLE public.affiliate_deals ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.affiliate_deals ALTER COLUMN price SET DEFAULT NULL;
