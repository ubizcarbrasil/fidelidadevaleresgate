-- Tabela de overrides de módulo por cidade
CREATE TABLE public.city_module_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  module_definition_id uuid NOT NULL REFERENCES public.module_definitions(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, module_definition_id)
);

CREATE INDEX idx_cmo_brand ON public.city_module_overrides(brand_id);
CREATE INDEX idx_cmo_branch ON public.city_module_overrides(branch_id);

-- Realtime
ALTER TABLE public.city_module_overrides REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_module_overrides;

-- Trigger updated_at
CREATE TRIGGER trg_cmo_updated_at
  BEFORE UPDATE ON public.city_module_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.city_module_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cmo_select_admins"
ON public.city_module_overrides FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);

CREATE POLICY "cmo_insert_admins"
ON public.city_module_overrides FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);

CREATE POLICY "cmo_update_admins"
ON public.city_module_overrides FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);

CREATE POLICY "cmo_delete_admins"
ON public.city_module_overrides FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'root_admin'::app_role)
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);

-- Função de resolução em cascata
CREATE OR REPLACE FUNCTION public.resolve_active_modules(
  p_brand_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE(module_key text, is_enabled boolean, source text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    md.key AS module_key,
    COALESCE(cmo.is_enabled, bm.is_enabled, md.is_core) AS is_enabled,
    CASE
      WHEN cmo.id IS NOT NULL THEN 'branch'
      WHEN bm.id IS NOT NULL THEN 'brand'
      WHEN md.is_core THEN 'core'
      ELSE 'inactive'
    END AS source
  FROM public.module_definitions md
  LEFT JOIN public.brand_modules bm
    ON bm.module_definition_id = md.id AND bm.brand_id = p_brand_id
  LEFT JOIN public.city_module_overrides cmo
    ON cmo.module_definition_id = md.id
   AND cmo.branch_id = p_branch_id
   AND p_branch_id IS NOT NULL;
$$;