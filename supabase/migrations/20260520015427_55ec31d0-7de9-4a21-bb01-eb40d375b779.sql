
-- ============================================================
-- 1) seed_initial_tier_memberships: também cria standings iniciais
-- ============================================================
CREATE OR REPLACE FUNCTION public.campeonato_seed_initial_tier_memberships(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_classification_starts_at timestamptz;
  v_already_seeded timestamptz;
  v_prior_season_id uuid;
  v_seeded_count integer := 0;
  v_by_tier jsonb := '{}'::jsonb;
  v_low_tier_id uuid;
  v_standings_inserted integer := 0;
BEGIN
  SELECT brand_id, branch_id, classification_starts_at, tier_seeding_completed_at
    INTO v_brand_id, v_branch_id, v_classification_starts_at, v_already_seeded
  FROM public.campeonato_seasons
  WHERE id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT (
    public.has_role(auth.uid(), 'root_admin')
    OR v_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
    OR v_branch_id IN (SELECT public.get_user_branch_ids(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para semear esta temporada';
  END IF;

  IF v_already_seeded IS NOT NULL THEN
    RAISE EXCEPTION 'Esta temporada já foi semeada em %', v_already_seeded;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campeonato_season_tiers WHERE season_id = p_season_id) THEN
    RAISE EXCEPTION 'Temporada % não tem séries configuradas', p_season_id;
  END IF;

  SELECT id INTO v_low_tier_id
  FROM public.campeonato_season_tiers
  WHERE season_id = p_season_id
  ORDER BY tier_order DESC
  LIMIT 1;

  SELECT ds.id INTO v_prior_season_id
  FROM public.campeonato_seasons ds
  WHERE ds.branch_id = v_branch_id
    AND ds.id <> p_season_id
    AND ds.tier_seeding_completed_at IS NOT NULL
    AND ds.classification_starts_at < v_classification_starts_at
  ORDER BY ds.classification_starts_at DESC
  LIMIT 1;

  PERFORM set_config('app.allow_tier_seed', 'on', true);

  WITH elegiveis AS (
    SELECT id AS driver_id, created_at
    FROM public.customers
    WHERE brand_id  = v_brand_id
      AND branch_id = v_branch_id
      AND is_active = true
      AND name ILIKE '%[MOTORISTA]%'
  ),
  metricas_90d AS (
    SELECT
      e.driver_id,
      e.created_at,
      COUNT(r.id)                       AS rides_90d,
      COALESCE(SUM(r.ride_value), 0)    AS total_value_90d,
      MAX(r.finalized_at)               AS last_finalized_at
    FROM elegiveis e
    LEFT JOIN public.machine_rides r
      ON r.driver_customer_id = e.driver_id
     AND r.branch_id          = v_branch_id
     AND r.ride_status        = 'FINALIZED'
     AND r.finalized_at       >= now() - interval '90 days'
    GROUP BY e.driver_id, e.created_at
  ),
  ranqueados AS (
    SELECT
      m.driver_id,
      m.rides_90d,
      m.total_value_90d,
      m.last_finalized_at,
      m.created_at,
      ROW_NUMBER() OVER (
        ORDER BY
          m.rides_90d         DESC,
          m.total_value_90d   DESC,
          m.last_finalized_at DESC NULLS LAST,
          m.created_at        ASC
      ) AS rn
    FROM metricas_90d m
    WHERE m.rides_90d >= 1
  ),
  tiers_ord AS (
    SELECT
      id AS tier_id,
      name AS tier_name,
      tier_order,
      target_size,
      SUM(target_size) OVER (ORDER BY tier_order) AS cumul_top
    FROM public.campeonato_season_tiers
    WHERE season_id = p_season_id
  ),
  prior_tier_por_driver AS (
    SELECT
      m_prev.driver_id,
      t_new.id AS tier_id
    FROM public.campeonato_tier_memberships m_prev
    JOIN public.campeonato_season_tiers t_prev
      ON t_prev.id = m_prev.tier_id
    JOIN public.campeonato_season_tiers t_new
      ON t_new.season_id = p_season_id
     AND t_new.name      = t_prev.name
    WHERE v_prior_season_id IS NOT NULL
      AND m_prev.season_id = v_prior_season_id
  ),
  alocacao AS (
    SELECT
      r.driver_id,
      COALESCE(
        (SELECT pt.tier_id FROM prior_tier_por_driver pt WHERE pt.driver_id = r.driver_id),
        COALESCE(
          (SELECT t.tier_id FROM tiers_ord t WHERE r.rn <= t.cumul_top ORDER BY t.tier_order LIMIT 1),
          v_low_tier_id
        )
      ) AS tier_id
    FROM ranqueados r
  ),
  inserted AS (
    INSERT INTO public.campeonato_tier_memberships (
      season_id, tier_id, driver_id, brand_id, branch_id, source
    )
    SELECT p_season_id, a.tier_id, a.driver_id, v_brand_id, v_branch_id, 'seed'
    FROM alocacao a
    WHERE a.tier_id IS NOT NULL
    ON CONFLICT (season_id, driver_id) DO NOTHING
    RETURNING tier_id, driver_id
  ),
  agg AS (
    SELECT i.tier_id, t.name AS tier_name, COUNT(*) AS cnt
    FROM inserted i
    JOIN public.campeonato_season_tiers t ON t.id = i.tier_id
    GROUP BY i.tier_id, t.name
  )
  SELECT
    COALESCE(SUM(cnt), 0)::int,
    COALESCE(jsonb_object_agg(tier_name, cnt), '{}'::jsonb)
  INTO v_seeded_count, v_by_tier
  FROM agg;

  -- Cria linhas iniciais de ranking para todos os motoristas alocados (idempotente)
  WITH ins AS (
    INSERT INTO public.campeonato_season_standings (
      season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto
    )
    SELECT tm.season_id, tm.driver_id, tm.tier_id, 0, 0, false, false
    FROM public.campeonato_tier_memberships tm
    WHERE tm.season_id = p_season_id
    ON CONFLICT (season_id, driver_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_standings_inserted FROM ins;

  UPDATE public.campeonato_seasons
     SET tier_seeding_completed_at = now()
   WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'seeded_count', COALESCE(v_seeded_count, 0),
    'standings_seeded', v_standings_inserted,
    'low_tier_overflow_count', 0,
    'by_tier', COALESCE(v_by_tier, '{}'::jsonb),
    'inherited_from_prior_season', v_prior_season_id
  );
END;
$function$;

-- ============================================================
-- 2) materialize_and_seed_season: idempotente (sucesso se já semeada)
-- ============================================================
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
  v_members_count integer;
  v_standings_count integer;
  v_backfill integer := 0;
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

  -- IDEMPOTÊNCIA: já foi semeada → não é erro
  IF v_already_seeded IS NOT NULL THEN
    -- Backfill defensivo de standings caso a corrida anterior tenha falhado entre seed e standings
    PERFORM set_config('app.allow_tier_seed', 'on', true);
    WITH ins AS (
      INSERT INTO public.campeonato_season_standings (
        season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto
      )
      SELECT tm.season_id, tm.driver_id, tm.tier_id, 0, 0, false, false
      FROM public.campeonato_tier_memberships tm
      WHERE tm.season_id = p_season_id
      ON CONFLICT (season_id, driver_id) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_backfill FROM ins;

    SELECT COUNT(*) INTO v_members_count FROM public.campeonato_tier_memberships WHERE season_id = p_season_id;
    SELECT COUNT(*) INTO v_standings_count FROM public.campeonato_season_standings WHERE season_id = p_season_id;

    RETURN jsonb_build_object(
      'ok', true,
      'already_seeded', true,
      'season_id', p_season_id,
      'seeded_at', v_already_seeded,
      'members_count', v_members_count,
      'standings_count', v_standings_count,
      'standings_backfilled', v_backfill
    );
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

-- ============================================================
-- 3) brand_get_campeonato_dashboard: contar por memberships (não só standings)
-- ============================================================
CREATE OR REPLACE FUNCTION public.brand_get_campeonato_dashboard(
  p_brand_id uuid,
  p_branch_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_active jsonb; v_tiers jsonb; v_season_id uuid;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN
    RAISE EXCEPTION 'Sem autorização';
  END IF;

  SELECT s.id, jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'branch_id', s.branch_id)
  INTO v_season_id, v_active
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
     AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
   ORDER BY s.created_at DESC LIMIT 1;

  IF v_season_id IS NULL THEN
    RETURN jsonb_build_object('active_season', NULL, 'tiers', '[]'::jsonb);
  END IF;

  WITH tier_top AS (
    SELECT t.id AS tier_id, t.name AS tier_name, t.tier_order,
           t.target_size, t.promotion_count, t.relegation_count,
      (SELECT COUNT(*)::int FROM public.campeonato_tier_memberships tm
         WHERE tm.season_id = v_season_id AND tm.tier_id = t.id) AS total_drivers,
      (SELECT COUNT(*)::int FROM public.campeonato_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id AND st2.qualified = true) AS qualified_count,
      (SELECT jsonb_agg(jsonb_build_object(
          'driver_id', x.driver_id, 'driver_name', x.driver_name,
          'points', x.points, 'weekend_rides_count', x.weekend_rides_count
        ) ORDER BY x.rn)
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                             COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
                 st.driver_id, c.name AS driver_name, st.points, st.weekend_rides_count
            FROM public.campeonato_season_standings st
            JOIN public.customers c ON c.id = st.driver_id
           WHERE st.season_id = v_season_id AND st.tier_id = t.id
        ) x WHERE x.rn <= 3) AS top3
      FROM public.campeonato_season_tiers t WHERE t.season_id = v_season_id
     ORDER BY t.tier_order)
  SELECT jsonb_agg(jsonb_build_object(
    'tier_id', tier_id, 'tier_name', tier_name, 'tier_order', tier_order,
    'target_size', target_size, 'promotion_count', promotion_count,
    'relegation_count', relegation_count, 'total_drivers', total_drivers,
    'members_count', total_drivers,
    'qualified_count', qualified_count, 'top3', COALESCE(top3,'[]'::jsonb)
  ) ORDER BY tier_order) INTO v_tiers FROM tier_top;

  RETURN jsonb_build_object('active_season', v_active, 'tiers', COALESCE(v_tiers,'[]'::jsonb));
END;
$function$;

-- ============================================================
-- 4) brand_get_season_summary: contar por memberships
-- ============================================================
CREATE OR REPLACE FUNCTION public.brand_get_season_summary(p_season_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tiers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'tier_id', t.id, 'tier_name', t.name, 'tier_order', t.tier_order,
        'target_size', t.target_size, 'promotion_count', t.promotion_count,
        'relegation_count', t.relegation_count, 'aborted_at', t.aborted_at,
        'members_count', (SELECT COUNT(*)::int FROM public.campeonato_tier_memberships
                            WHERE season_id = s.id AND tier_id = t.id),
        'total_drivers', (SELECT COUNT(*)::int FROM public.campeonato_tier_memberships
                            WHERE season_id = s.id AND tier_id = t.id),
        'qualified_count', (SELECT COUNT(*)::int FROM public.campeonato_season_standings
                              WHERE season_id = s.id AND tier_id = t.id AND qualified = true)
      ) ORDER BY t.tier_order)
        FROM public.campeonato_season_tiers t WHERE t.season_id = s.id), '[]'::jsonb)
  ) INTO v_result FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  RETURN v_result;
END; $function$;

-- ============================================================
-- 5) brand_get_campeonato_kpis (assinatura com p_branch_id) — total_drivers por memberships já estava OK,
--    mas garantimos by_tier consistente (continua via memberships join tiers). Nada a alterar funcionalmente.
-- ============================================================

-- ============================================================
-- 6) Reparo da temporada Maio 2026 já criada (cria standings p/ 74 motoristas alocados)
-- ============================================================
INSERT INTO public.campeonato_season_standings (
  season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto
)
SELECT tm.season_id, tm.driver_id, tm.tier_id, 0, 0, false, false
FROM public.campeonato_tier_memberships tm
JOIN public.campeonato_seasons s ON s.id = tm.season_id
WHERE s.phase NOT IN ('finished','cancelled')
  AND s.cancelled_at IS NULL
ON CONFLICT (season_id, driver_id) DO NOTHING;
