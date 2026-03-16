
-- Sub-items (subclass permissions) within a main permission
CREATE TABLE public.permission_sub_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  display_name text NOT NULL,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (permission_id, key)
);

ALTER TABLE public.permission_sub_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root admins can manage sub items"
  ON public.permission_sub_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Authenticated can read sub items"
  ON public.permission_sub_items FOR SELECT TO authenticated
  USING (true);

-- Brand-level config for sub-items
CREATE TABLE public.brand_sub_permission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  sub_item_id uuid REFERENCES public.permission_sub_items(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  is_allowed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX brand_sub_perm_unique ON public.brand_sub_permission_config (brand_id, sub_item_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'));

ALTER TABLE public.brand_sub_permission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root admins can manage sub perm config"
  ON public.brand_sub_permission_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "Brand admins can read own sub perm config"
  ON public.brand_sub_permission_config FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));
