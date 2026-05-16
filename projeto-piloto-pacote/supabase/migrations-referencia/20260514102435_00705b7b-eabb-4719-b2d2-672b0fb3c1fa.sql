
-- 1) Substituir a UNIQUE total por um índice único parcial (apenas não canceladas)
ALTER TABLE public.campeonato_seasons
  DROP CONSTRAINT IF EXISTS duelo_seasons_brand_id_branch_id_year_month_key;

DROP INDEX IF EXISTS public.duelo_seasons_brand_id_branch_id_year_month_key;

CREATE UNIQUE INDEX IF NOT EXISTS campeonato_seasons_active_brand_branch_year_month_key
  ON public.campeonato_seasons (brand_id, branch_id, year, month)
  WHERE cancelled_at IS NULL;

-- 2) Tornar a materialização das séries idempotente (evita duplicate key em campeonato_season_tiers)
CREATE OR REPLACE FUNCTION public.campeonato_materialize_and_seed_season(p_season_id uuid, p_caller uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_tenant_id uuid;
  v_tiers_config jsonb;
  v_already_seeded timestamptz;
  v_existing_tiers integer;
  v_serie jsonb;
  v_seed_result jsonb;
  v_caller uuid := COALESCE(p_caller, auth.uid());
  v_authorized boolean := false;
BEGIN
  SELECT ds.brand_id, ds.branch_id, b.tenant_id, ds.tiers_config_json, ds.tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_tenant_id, v_tiers_config, v_already_seeded
  FROM public.campeonato_seasons ds
  LEFT JOIN public.brands b ON b.id = ds.brand_id
  WHERE ds.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_caller IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = v_caller
        AND (
          ur.role = 'root_admin'
          OR (ur.role = 'tenant_admin' AND (ur.tenant_id = v_tenant_id OR ur.brand_id = v_brand_id))
          OR (ur.role = 'brand_admin' AND ur.brand_id = v_brand_id)
          OR (ur.role = 'branch_admin' AND v_branch_id IS NOT NULL AND ur.branch_id = v_branch_id)
        )
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  IF v_already_seeded IS NOT NULL THEN
    RAISE EXCEPTION 'Esta temporada já foi semeada em %', v_already_seeded;
  END IF;

  SELECT COUNT(*) INTO v_existing_tiers
  FROM public.campeonato_season_tiers
  WHERE season_id = p_season_id;

  IF v_existing_tiers = 0 THEN
    IF v_tiers_config IS NULL OR v_tiers_config->'series' IS NULL THEN
      RAISE EXCEPTION 'Temporada % sem tiers_config_json válido', p_season_id;
    END IF;

    FOR v_serie IN SELECT * FROM jsonb_array_elements(v_tiers_config->'series')
    LOOP
      INSERT INTO public.campeonato_season_tiers (
        season_id, brand_id, branch_id, name,
        tier_order, target_size, promotion_count, relegation_count
      ) VALUES (
        p_season_id, v_brand_id, v_branch_id,
        v_serie->>'name',
        COALESCE((v_serie->>'tier_order')::int, 1),
        COALESCE((v_serie->>'target_size')::int, (v_serie->>'size')::int, 16),
        COALESCE((v_serie->>'promotion_count')::int, (v_serie->>'promote_count')::int, 0),
        COALESCE((v_serie->>'relegation_count')::int, (v_serie->>'relegate_count')::int, 0)
      )
      ON CONFLICT (season_id, tier_order) DO NOTHING;
    END LOOP;
  END IF;

  IF v_caller IS NOT NULL THEN
    PERFORM set_config('request.jwt.claim.sub', v_caller::text, true);
  END IF;

  v_seed_result := public.campeonato_seed_initial_tier_memberships(p_season_id);

  RETURN jsonb_build_object(
    'ok', true,
    'season_id', p_season_id,
    'tiers_materialized', v_existing_tiers = 0,
    'seed_result', v_seed_result
  );
END;
$function$;
