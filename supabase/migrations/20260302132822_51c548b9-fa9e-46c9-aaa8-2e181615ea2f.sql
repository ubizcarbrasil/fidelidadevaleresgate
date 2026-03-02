
-- Table to store permission overflow config: ROOT→Brand and Brand→Store
CREATE TABLE public.brand_permission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed_for_brand boolean NOT NULL DEFAULT true,
  allowed_for_store boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, permission_key)
);

-- Enable RLS
ALTER TABLE public.brand_permission_config ENABLE ROW LEVEL SECURITY;

-- Root can do everything
CREATE POLICY "Root manages brand_permission_config"
ON public.brand_permission_config
FOR ALL
USING (has_role(auth.uid(), 'root_admin'::app_role));

-- Brand admins can read their own config
CREATE POLICY "Brand admins read own permission config"
ON public.brand_permission_config
FOR SELECT
USING (
  brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
);

-- Brand admins can update allowed_for_store (but not allowed_for_brand)
CREATE POLICY "Brand admins update store permissions"
ON public.brand_permission_config
FOR UPDATE
USING (
  brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
);

-- Trigger for updated_at
CREATE TRIGGER update_brand_permission_config_updated_at
BEFORE UPDATE ON public.brand_permission_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_brand_permission_config_brand ON public.brand_permission_config(brand_id);
