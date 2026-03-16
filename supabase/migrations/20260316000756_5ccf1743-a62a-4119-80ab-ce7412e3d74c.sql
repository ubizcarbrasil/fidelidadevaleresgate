
-- 1. Permission Groups (nível 1 da hierarquia)
CREATE TABLE public.permission_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_name text DEFAULT 'Blocks',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permission_groups"
  ON public.permission_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Root admins can manage permission_groups"
  ON public.permission_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

-- 2. Permission Subgroups (nível 2)
CREATE TABLE public.permission_subgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.permission_groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.permission_subgroups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permission_subgroups"
  ON public.permission_subgroups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Root admins can manage permission_subgroups"
  ON public.permission_subgroups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

-- 3. Add hierarchy columns to permissions
ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS subgroup_id uuid REFERENCES public.permission_subgroups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS order_index int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 4. Expand brand_permission_config for branch scope
ALTER TABLE public.brand_permission_config
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'brand';

-- Drop old unique constraint if exists and add new one
ALTER TABLE public.brand_permission_config
  DROP CONSTRAINT IF EXISTS brand_permission_config_brand_id_permission_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS brand_permission_config_brand_perm_branch_uniq
  ON public.brand_permission_config (brand_id, permission_key, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));
