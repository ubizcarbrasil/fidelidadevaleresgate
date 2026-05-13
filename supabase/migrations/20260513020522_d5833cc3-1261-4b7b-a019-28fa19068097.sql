CREATE OR REPLACE FUNCTION public.duelo_materialize_and_seed_season(
  p_season_id uuid,
  p_caller uuid DEFAULT NULL
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
  v_caller uuid := COALESCE(p_caller, auth.uid());
BEGIN
  SELECT brand_id, branch_id, tiers_config_json, tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_tiers_config, v_already_seeded
  FROM public.duelo_seasons
  WHERE id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_caller IS NULL OR NOT (
    public.has_role(v_caller, 'root_admin')
    OR v_brand_id IN (SELECT public.get_user_brand_ids(v_caller))
    OR v_branch_id IN (SELECT public.get_user_branch_ids(v_caller))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  IF v_already_seeded IS NOT NULL THEN
    RAISE EXCEPTION 'Esta temporada já foi semeada em %', v_already_seeded;
  END IF;

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
        tier_order, target_size, promotion_count, relegation_count,
        prize_per_position_json
      ) VALUES (
        p_season_id, v_brand_id, v_branch_id,
        v_serie->>'name',
        (v_serie->>'tier_order')::int,
        (v_serie->>'target_size')::int,
        COALESCE((v_serie->>'promotion_count')::int, 0),
        COALESCE((v_serie->>'relegation_count')::int, 0),
        COALESCE(v_serie->'prize_per_position_json', '[]'::jsonb)
      );
    END LOOP;
  END IF;

  v_seed_result := public.duelo_seed_initial_tier_memberships(p_season_id);

  RETURN jsonb_build_object(
    'ok', true,
    'season_id', p_season_id,
    'tiers_materialized', v_existing_tiers = 0,
    'seed_result', v_seed_result
  );
END;
$function$;