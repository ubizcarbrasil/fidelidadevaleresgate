
-- Add customization columns to brand_sections for banner and display configuration
ALTER TABLE public.brand_sections
  ADD COLUMN IF NOT EXISTS banner_image_url text,
  ADD COLUMN IF NOT EXISTS banner_height text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS display_mode text NOT NULL DEFAULT 'carousel';
