ALTER TABLE public.partner_landing_config
  ADD COLUMN testimonials_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN social_instagram text,
  ADD COLUMN social_whatsapp text,
  ADD COLUMN social_email text,
  ADD COLUMN cta_link_url text;