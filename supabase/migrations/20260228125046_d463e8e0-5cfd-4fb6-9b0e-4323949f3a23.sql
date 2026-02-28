
-- 1. Section template types
CREATE TYPE public.section_type AS ENUM (
  'BANNER_CAROUSEL',
  'OFFERS_CAROUSEL',
  'OFFERS_GRID',
  'STORES_GRID',
  'STORES_LIST',
  'VOUCHERS_CARDS'
);

CREATE TYPE public.section_source_type AS ENUM (
  'OFFERS',
  'STORES',
  'CATEGORIES',
  'CUSTOM_QUERY',
  'MANUAL'
);

-- 2. section_templates (platform-level)
CREATE TABLE public.section_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  type section_type NOT NULL,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active templates"
  ON public.section_templates FOR SELECT USING (true);

CREATE POLICY "Root admins can manage templates"
  ON public.section_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role));

-- 3. brand_sections
CREATE TABLE public.brand_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.section_templates(id) ON DELETE RESTRICT,
  title text,
  subtitle text,
  cta_text text,
  order_index integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  visual_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_sections_brand ON public.brand_sections(brand_id);
CREATE INDEX idx_brand_sections_order ON public.brand_sections(brand_id, order_index);

ALTER TABLE public.brand_sections ENABLE ROW LEVEL SECURITY;

-- Public read for white-label
CREATE POLICY "Anyone can read enabled brand sections"
  ON public.brand_sections FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Root admins can manage brand sections"
  ON public.brand_sections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Tenant admins can manage brand sections"
  ON public.brand_sections FOR ALL TO authenticated
  USING (brand_id IN (
    SELECT b.id FROM brands b
    WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
  ));

CREATE POLICY "Brand admins can manage own brand sections"
  ON public.brand_sections FOR ALL TO authenticated
  USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_brand_sections_updated_at
  BEFORE UPDATE ON public.brand_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. brand_section_sources
CREATE TABLE public.brand_section_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_section_id uuid NOT NULL REFERENCES public.brand_sections(id) ON DELETE CASCADE,
  source_type section_source_type NOT NULL,
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  "limit" integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_section_sources_section ON public.brand_section_sources(brand_section_id);

ALTER TABLE public.brand_section_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read section sources"
  ON public.brand_section_sources FOR SELECT USING (true);

CREATE POLICY "Root admins can manage section sources"
  ON public.brand_section_sources FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Tenant admins can manage section sources"
  ON public.brand_section_sources FOR ALL TO authenticated
  USING (brand_section_id IN (
    SELECT bs.id FROM brand_sections bs
    WHERE bs.brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    )
  ));

CREATE POLICY "Brand admins can manage own section sources"
  ON public.brand_section_sources FOR ALL TO authenticated
  USING (brand_section_id IN (
    SELECT bs.id FROM brand_sections bs
    WHERE bs.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  ));

-- 5. brand_section_manual_items
CREATE TABLE public.brand_section_manual_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_section_id uuid NOT NULL REFERENCES public.brand_sections(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('offer', 'store')),
  item_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_items_section ON public.brand_section_manual_items(brand_section_id);

ALTER TABLE public.brand_section_manual_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manual items"
  ON public.brand_section_manual_items FOR SELECT USING (true);

CREATE POLICY "Root admins can manage manual items"
  ON public.brand_section_manual_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role));

CREATE POLICY "Tenant admins can manage manual items"
  ON public.brand_section_manual_items FOR ALL TO authenticated
  USING (brand_section_id IN (
    SELECT bs.id FROM brand_sections bs
    WHERE bs.brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    )
  ));

CREATE POLICY "Brand admins can manage own manual items"
  ON public.brand_section_manual_items FOR ALL TO authenticated
  USING (brand_section_id IN (
    SELECT bs.id FROM brand_sections bs
    WHERE bs.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  ));

-- 6. Seed default templates
INSERT INTO public.section_templates (key, name, type, schema_json) VALUES
  ('banner_hero', 'Banner Hero Carousel', 'BANNER_CAROUSEL', '{"max_items": 5, "aspect_ratio": "16:9", "autoplay": true, "interval_ms": 5000}'::jsonb),
  ('offers_carousel', 'Carrossel de Ofertas', 'OFFERS_CAROUSEL', '{"card_style": "compact", "max_visible": 4, "show_price": true}'::jsonb),
  ('offers_grid', 'Grade de Ofertas', 'OFFERS_GRID', '{"columns": 3, "max_items": 12, "show_price": true}'::jsonb),
  ('stores_grid', 'Grade de Lojas', 'STORES_GRID', '{"columns": 4, "max_items": 8, "show_logo": true}'::jsonb),
  ('stores_list', 'Lista de Lojas', 'STORES_LIST', '{"max_items": 10, "show_address": true, "show_distance": true}'::jsonb),
  ('vouchers_cards', 'Cards de Vouchers', 'VOUCHERS_CARDS', '{"columns": 3, "max_items": 9, "show_expiry": true, "show_discount": true}'::jsonb);
