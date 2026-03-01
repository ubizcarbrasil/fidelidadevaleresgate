
-- Add page_id column to brand_sections to link dynamic sections to custom pages
ALTER TABLE public.brand_sections 
ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES public.custom_pages(id) ON DELETE CASCADE;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_brand_sections_page_id ON public.brand_sections(page_id);
