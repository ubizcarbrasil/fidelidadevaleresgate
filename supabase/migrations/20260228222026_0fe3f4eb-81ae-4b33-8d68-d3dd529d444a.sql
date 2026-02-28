
-- 1. Icon Library
CREATE TABLE public.icon_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  icon_type text NOT NULL DEFAULT 'lucide',
  lucide_name text,
  image_url text,
  color text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.icon_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active icons"
  ON public.icon_library FOR SELECT
  USING (is_active = true);

CREATE POLICY "Brand admins manage icons"
  ON public.icon_library FOR ALL
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (brand_id IN (SELECT get_user_brand_ids(auth.uid())))
    OR (brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))))
  );

-- 2. Banner Schedules
CREATE TABLE public.banner_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  brand_section_id uuid REFERENCES public.brand_sections(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  title text,
  link_url text,
  link_type text NOT NULL DEFAULT 'external',
  link_target_id uuid,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active banners"
  ON public.banner_schedules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Brand admins manage banners"
  ON public.banner_schedules FOR ALL
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (brand_id IN (SELECT get_user_brand_ids(auth.uid())))
    OR (brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))))
  );

CREATE TRIGGER update_banner_schedules_updated_at
  BEFORE UPDATE ON public.banner_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Menu Labels
CREATE TABLE public.menu_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  context text NOT NULL DEFAULT 'admin',
  key text NOT NULL,
  custom_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, context, key)
);

ALTER TABLE public.menu_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu labels"
  ON public.menu_labels FOR SELECT
  USING (true);

CREATE POLICY "Brand admins manage menu labels"
  ON public.menu_labels FOR ALL
  USING (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (brand_id IN (SELECT get_user_brand_ids(auth.uid())))
    OR (brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))))
  );

CREATE TRIGGER update_menu_labels_updated_at
  BEFORE UPDATE ON public.menu_labels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
