CREATE OR REPLACE FUNCTION public.resolve_active_business_models(
  p_brand_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS TABLE (
  model_key text,
  is_enabled boolean,
  source text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH all_models AS (
    SELECT id, key
    FROM business_models
    WHERE is_active = true
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
  )
  SELECT
    m.key::text AS model_key,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN br.is_enabled
      WHEN bs.business_model_id IS NOT NULL THEN bs.is_enabled
      ELSE false
    END AS is_enabled,
    CASE
      WHEN br.business_model_id IS NOT NULL THEN 'branch'
      WHEN bs.business_model_id IS NOT NULL THEN 'brand'
      ELSE 'inactive'
    END::text AS source
  FROM all_models m
  LEFT JOIN brand_state bs ON bs.business_model_id = m.id
  LEFT JOIN branch_state br ON br.business_model_id = m.id
  ORDER BY m.key;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_active_business_models(uuid, uuid) TO authenticated, anon;