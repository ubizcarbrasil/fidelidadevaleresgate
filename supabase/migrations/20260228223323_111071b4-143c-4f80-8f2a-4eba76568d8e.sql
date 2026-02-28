-- Phase 2: Add modular section columns to brand_sections
ALTER TABLE public.brand_sections
  ADD COLUMN IF NOT EXISTS rows_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS columns_count integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS icon_size text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS filter_mode text NOT NULL DEFAULT 'recent',
  ADD COLUMN IF NOT EXISTS coupon_type_filter text,
  ADD COLUMN IF NOT EXISTS min_stores_visible integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_stores_visible integer,
  ADD COLUMN IF NOT EXISTS city_filter_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS banners_json jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Phase 4: Create custom_pages table for page builder
CREATE TABLE public.custom_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  elements_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  permissions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(brand_id, slug)
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published pages"
ON public.custom_pages FOR SELECT
USING (is_published = true);

CREATE POLICY "Brand admins manage custom pages"
ON public.custom_pages FOR ALL
USING (
  has_role(auth.uid(), 'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
);

CREATE TRIGGER update_custom_pages_updated_at
BEFORE UPDATE ON public.custom_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();