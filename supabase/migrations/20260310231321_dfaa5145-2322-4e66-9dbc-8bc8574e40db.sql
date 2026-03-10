
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS redirect_url text DEFAULT null;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS bg_color text DEFAULT null;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS text_color text DEFAULT null;
