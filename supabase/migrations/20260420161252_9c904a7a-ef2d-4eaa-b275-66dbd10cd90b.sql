
-- Etapa 1: já aplicada parcialmente. Verifica e completa.

-- Coluna branch_id (idempotente)
ALTER TABLE public.brand_business_model_addons
  ADD COLUMN IF NOT EXISTS branch_id uuid NULL REFERENCES public.branches(id) ON DELETE CASCADE;

-- UNIQUE: dropar se ainda existir e recriar
ALTER TABLE public.brand_business_model_addons
  DROP CONSTRAINT IF EXISTS brand_business_model_addons_unique;

DROP INDEX IF EXISTS public.brand_business_model_addons_unique;

CREATE UNIQUE INDEX brand_business_model_addons_unique
  ON public.brand_business_model_addons (
    brand_id,
    COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid),
    business_model_id
  );

CREATE INDEX IF NOT EXISTS idx_bbma_branch
  ON public.brand_business_model_addons (branch_id) WHERE branch_id IS NOT NULL;

-- resolve_active_business_models: assinatura mantida (mesmo retorno), só corpo muda
CREATE OR REPLACE FUNCTION public.resolve_active_business_models(
  p_brand_id uuid,
  p_branch_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(model_key text, is_enabled boolean, source text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH all_models AS (
    SELECT id, key FROM business_models WHERE is_active = true
  ),
  brand_state AS (
    SELECT business_model_id, is_enabled
    FROM brand_business_models
    WHERE brand_id = p_brand_id
  ),
  branch_state AS (
    SELECT business_model_id, is_enabled
    FROM city_business_model_overrides
    WHERE brand_id = p_brand_id
      AND p_branch_id IS NOT NULL
      AND branch_id = p_branch_id
  ),
  addon_brand AS (
    SELECT business_model_id
    FROM brand_business_model_addons
    WHERE brand_id = p_brand_id
      AND branch_id IS NULL
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  ),
  addon_branch AS (
    SELECT business_model_id
    FROM brand_business_model_addons
    WHERE brand_id = p_brand_id
      AND p_branch_id IS NOT NULL
      AND branch_id = p_branch_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
  SELECT
    m.key::text AS model_key,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN br.is_enabled
      WHEN bs.business_model_id IS NOT NULL THEN bs.is_enabled
      WHEN abr.business_model_id IS NOT NULL OR ab.business_model_id IS NOT NULL THEN true
      ELSE false
    END AS is_enabled,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN 'branch'
      WHEN abr.business_model_id IS NOT NULL THEN 'addon_branch'
      WHEN ab.business_model_id IS NOT NULL THEN 'addon'
      WHEN bs.business_model_id IS NOT NULL THEN 'brand'
      ELSE 'inactive'
    END::text AS source
  FROM all_models m
  LEFT JOIN brand_state bs ON bs.business_model_id = m.id
  LEFT JOIN branch_state br ON br.business_model_id = m.id
  LEFT JOIN addon_brand ab ON ab.business_model_id = m.id
  LEFT JOIN addon_branch abr ON abr.business_model_id = m.id
  ORDER BY m.key;
$function$;

-- list_business_model_addons: assinatura mudou (novas colunas) → DROP + CREATE
DROP FUNCTION IF EXISTS public.list_business_model_addons();

CREATE FUNCTION public.list_business_model_addons()
RETURNS TABLE(
  id uuid,
  brand_id uuid,
  brand_name text,
  brand_slug text,
  subscription_plan text,
  branch_id uuid,
  branch_name text,
  business_model_id uuid,
  model_key text,
  model_name text,
  model_audience text,
  status text,
  billing_cycle text,
  price_cents integer,
  activated_at timestamp with time zone,
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    a.id,
    a.brand_id,
    b.name::text AS brand_name,
    b.slug::text AS brand_slug,
    b.subscription_plan::text,
    a.branch_id,
    br.name::text AS branch_name,
    a.business_model_id,
    m.key::text AS model_key,
    m.name::text AS model_name,
    m.audience::text AS model_audience,
    a.status,
    a.billing_cycle,
    a.price_cents,
    a.activated_at,
    a.expires_at,
    a.notes,
    a.created_at
  FROM brand_business_model_addons a
  JOIN brands b ON b.id = a.brand_id
  JOIN business_models m ON m.id = a.business_model_id
  LEFT JOIN branches br ON br.id = a.branch_id
  WHERE public.has_role(auth.uid(), 'root_admin'::app_role)
  ORDER BY a.created_at DESC;
$function$;
