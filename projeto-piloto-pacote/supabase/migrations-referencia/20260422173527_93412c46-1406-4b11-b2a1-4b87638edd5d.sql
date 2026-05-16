
-- ===================================================================
-- RPC: duelo_materialize_and_seed_season
-- Materializa duelo_season_tiers a partir de tiers_config_json e
-- chama duelo_seed_initial_tier_memberships na sequência.
-- Idempotente: se já houver tiers, pula a materialização.
-- ===================================================================
CREATE OR REPLACE FUNCTION public.duelo_materialize_and_seed_season(
  p_season_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_tiers_config jsonb;
  v_already_seeded timestamptz;
  v_existing_tiers integer;
  v_serie jsonb;
  v_seed_result jsonb;
BEGIN
  SELECT brand_id, branch_id, tiers_config_json, tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_tiers_config, v_already_seeded
  FROM public.duelo_seasons
  WHERE id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR v_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR v_branch_id IN (SELECT public.get_user_branch_ids(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  IF v_already_seeded IS NOT NULL THEN
    RAISE EXCEPTION 'Esta temporada já foi semeada em %', v_already_seeded;
  END IF;

  -- Materializar tiers se ainda não existirem
  SELECT COUNT(*) INTO v_existing_tiers
  FROM public.duelo_season_tiers
  WHERE season_id = p_season_id;

  IF v_existing_tiers = 0 THEN
    IF v_tiers_config IS NULL OR v_tiers_config->'series' IS NULL THEN
      RAISE EXCEPTION 'Temporada % sem tiers_config_json válido', p_season_id;
    END IF;

    FOR v_serie IN SELECT * FROM jsonb_array_elements(v_tiers_config->'series')
    LOOP
      INSERT INTO public.duelo_season_tiers (
        season_id, brand_id, branch_id, name,
        tier_order, target_size, promotion_count, relegation_count
      )
      VALUES (
        p_season_id,
        v_brand_id,
        v_branch_id,
        v_serie->>'name',
        (v_serie->>'tier_order')::int,
        COALESCE((v_serie->>'size')::int, 16),
        COALESCE((v_serie->>'promote_count')::int, 0),
        COALESCE((v_serie->>'relegate_count')::int, 0)
      );
    END LOOP;
  END IF;

  -- Disparar seeding
  v_seed_result := public.duelo_seed_initial_tier_memberships(p_season_id);

  RETURN v_seed_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.duelo_materialize_and_seed_season(uuid) TO authenticated;

-- ===================================================================
-- RPC: driver_get_pending_or_active_season
-- Retorna temporada vigente mesmo quando o motorista ainda não tem
-- tier_membership (ex.: temporada criada mas seeding pendente).
-- ===================================================================
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

  -- Tenta primeiro o caminho normal: motorista distribuído
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
     AND s.phase <> 'finished'
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Fallback: motorista ainda não distribuído. Procura temporada
  -- vigente na cidade do motorista (seeding pendente).
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
     AND s.phase <> 'finished'
     AND s.cancelled_at IS NULL
     AND s.tier_seeding_completed_at IS NULL
   ORDER BY s.created_at DESC
   LIMIT 1;

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.driver_get_pending_or_active_season(uuid, uuid) TO authenticated, anon;
