-- 1) driver_get_pending_or_active_season: ignorar temporadas canceladas
CREATE OR REPLACE FUNCTION public.driver_get_pending_or_active_season(
  p_brand_id uuid,
  p_driver_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_driver_branch_id uuid;
BEGIN
  IF NOT public.driver_belongs_to_brand(p_driver_id, p_brand_id) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'phase', s.phase,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tier_id', tm.tier_id,
    'tier_name', t.name,
    'tier_order', t.tier_order,
    'driver_points', st.points,
    'driver_weekend_rides', st.weekend_rides_count,
    'driver_position', st.position_in_tier,
    'driver_qualified', st.qualified,
    'driver_relegated_auto', st.relegated_auto,
    'is_pending_seeding', false
  ) INTO v_result
    FROM public.duelo_seasons s
    JOIN public.duelo_tier_memberships tm
      ON tm.season_id = s.id AND tm.driver_id = p_driver_id
    JOIN public.duelo_season_tiers t ON t.id = tm.tier_id
    LEFT JOIN public.duelo_season_standings st
      ON st.season_id = s.id AND st.driver_id = p_driver_id
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  SELECT branch_id INTO v_driver_branch_id
    FROM public.customers
   WHERE id = p_driver_id;

  IF v_driver_branch_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'phase', s.phase,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tier_id', NULL,
    'tier_name', NULL,
    'tier_order', NULL,
    'driver_points', 0,
    'driver_weekend_rides', 0,
    'driver_position', NULL,
    'driver_qualified', false,
    'driver_relegated_auto', false,
    'is_pending_seeding', true
  ) INTO v_result
    FROM public.duelo_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.branch_id = v_driver_branch_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
     AND s.tier_seeding_completed_at IS NULL
   ORDER BY s.created_at DESC
   LIMIT 1;

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.driver_get_pending_or_active_season(uuid, uuid) TO authenticated, anon;

-- 2) duelo_change_engagement_format: ignorar temporadas canceladas
CREATE OR REPLACE FUNCTION public.duelo_change_engagement_format(
  p_brand_id uuid,
  p_new_format text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_previous text;
  v_allowed text[];
  v_model_id uuid;
BEGIN
  IF p_new_format NOT IN ('duelo', 'mass_duel', 'campeonato') THEN
    RAISE EXCEPTION 'Formato inválido: %', p_new_format;
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR (
      p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
      AND public.has_role(auth.uid(), 'brand_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Sem autorização para alterar formato';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.duelo_seasons
    WHERE brand_id = p_brand_id
      AND phase NOT IN ('finished','cancelled')
      AND cancelled_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Não é possível trocar formato com temporada ativa. Aguarde finalização ou cancele a temporada.';
  END IF;

  SELECT id INTO v_model_id
  FROM public.business_models
  WHERE key = 'duelo_motorista'
  LIMIT 1;

  IF v_model_id IS NULL THEN
    RAISE EXCEPTION 'Modelo de negócio duelo_motorista não cadastrado.';
  END IF;

  SELECT bbm.engagement_format, bbm.allowed_engagement_formats
    INTO v_previous, v_allowed
  FROM public.brand_business_models bbm
  WHERE bbm.brand_id = p_brand_id
    AND bbm.business_model_id = v_model_id
  LIMIT 1;

  IF v_allowed IS NOT NULL AND p_new_format <> ALL (v_allowed) THEN
    RAISE EXCEPTION 'Formato % não está liberado para esta marca. Fale com o suporte.', p_new_format;
  END IF;

  INSERT INTO public.brand_business_models (brand_id, business_model_id, is_enabled, engagement_format)
    VALUES (p_brand_id, v_model_id, true, p_new_format)
  ON CONFLICT (brand_id, business_model_id)
    DO UPDATE SET engagement_format = EXCLUDED.engagement_format,
                  is_enabled = true,
                  updated_at = now();

  RETURN jsonb_build_object('previous', v_previous, 'new', p_new_format);
END;
$function$;
