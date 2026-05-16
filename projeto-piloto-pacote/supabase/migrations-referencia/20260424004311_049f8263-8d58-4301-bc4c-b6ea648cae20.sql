-- ============================================================================
-- ATIVACAO CORRETIVA CAMPEONATO — UBIZ RESGATA / ARAXA-MG
-- Caminho 1: seeding inline (replica fiel de duelo_seed_initial_tier_memberships)
-- Zero alteracao em RPCs/triggers existentes.
-- ROLLBACK manual:
--   DELETE FROM duelo_tier_memberships WHERE season_id = '<season_id>';
--   DELETE FROM duelo_season_tiers     WHERE season_id = '<season_id>';
--   DELETE FROM duelo_seasons          WHERE id        = '<season_id>';
--   DELETE FROM brand_business_models  WHERE brand_id  = 'db15bd21-9137-4965-a0fb-540d8e8b26f1' AND business_model_id = (SELECT id FROM business_models WHERE key='duelo_motorista');
--   DELETE FROM duelo_attempts_log     WHERE code='brand_campeonato_toggled' AND details_json->>'source'='manual_corrective_migration';
-- ============================================================================
DO $mig$
DECLARE
  v_brand_id   uuid := 'db15bd21-9137-4965-a0fb-540d8e8b26f1';
  v_branch_id  uuid := '7bb6c717-34bb-4364-84b5-e6cce6caea66';
  v_bm_id      uuid;
  v_season_id  uuid;
  v_tier_a_id  uuid;
  v_tier_b_id  uuid;
  v_tier_c_id  uuid;
  v_low_tier_id uuid;
  v_seeded_count integer := 0;
  v_low_overflow_count integer := 0;
  v_by_tier jsonb := '{}'::jsonb;
  v_now timestamptz := now();
BEGIN
  -- ---------------------------------------------------------------------------
  -- FASE A.1 — Upsert brand_business_models (Gate 3)
  -- ---------------------------------------------------------------------------
  SELECT id INTO v_bm_id FROM public.business_models WHERE key = 'duelo_motorista';
  IF v_bm_id IS NULL THEN
    RAISE EXCEPTION 'business_models.key=duelo_motorista nao encontrado';
  END IF;

  INSERT INTO public.brand_business_models (
    brand_id, business_model_id, is_enabled, engagement_format,
    allowed_engagement_formats, config_json, activated_at
  ) VALUES (
    v_brand_id, v_bm_id, true, 'campeonato',
    ARRAY['campeonato']::text[],
    jsonb_build_object('features', jsonb_build_object(
      'cinturao',   true,
      'ranking',    true,
      'aposta',     false,
      'campeonato', true
    )),
    v_now
  )
  ON CONFLICT (brand_id, business_model_id) DO UPDATE SET
    is_enabled                 = true,
    engagement_format          = 'campeonato',
    allowed_engagement_formats = ARRAY['campeonato']::text[],
    config_json                = jsonb_set(
      COALESCE(public.brand_business_models.config_json, '{}'::jsonb),
      '{features}',
      jsonb_build_object(
        'cinturao',   true,
        'ranking',    true,
        'aposta',     false,
        'campeonato', true
      ),
      true
    ),
    activated_at               = COALESCE(public.brand_business_models.activated_at, v_now),
    updated_at                 = v_now;

  -- ---------------------------------------------------------------------------
  -- FASE A.2 — INSERT duelo_seasons (Gate 4)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.duelo_seasons (
    brand_id, branch_id, name, year, month, phase,
    classification_starts_at, classification_ends_at,
    knockout_starts_at,        knockout_ends_at,
    tiers_count, relegation_policy, tiers_config_json,
    scoring_mode, scoring_config_json
  ) VALUES (
    v_brand_id, v_branch_id,
    'Temporada Abril/2026',
    EXTRACT(YEAR FROM v_now)::int,
    EXTRACT(MONTH FROM v_now)::int,
    'classification',
    v_now,
    v_now + interval '2 days',
    v_now + interval '2 days',
    v_now + interval '3 days',
    3,
    'auto_zero',
    jsonb_build_object('series', jsonb_build_array(
      jsonb_build_object('name','A','tier_order',1,'size',25,'promote_count',0,'relegate_count',5),
      jsonb_build_object('name','B','tier_order',2,'size',25,'promote_count',5,'relegate_count',5),
      jsonb_build_object('name','C','tier_order',3,'size',25,'promote_count',5,'relegate_count',0)
    )),
    'total_points',
    '{"win": 3, "draw": 1, "loss": 0}'::jsonb
  )
  RETURNING id INTO v_season_id;

  -- ---------------------------------------------------------------------------
  -- FASE A.3 — Materializar tiers A/B/C (replica de duelo_materialize_and_seed_season)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.duelo_season_tiers (
    season_id, brand_id, branch_id, name, tier_order, target_size, promotion_count, relegation_count
  ) VALUES (v_season_id, v_brand_id, v_branch_id, 'A', 1, 25, 0, 5)
  RETURNING id INTO v_tier_a_id;

  INSERT INTO public.duelo_season_tiers (
    season_id, brand_id, branch_id, name, tier_order, target_size, promotion_count, relegation_count
  ) VALUES (v_season_id, v_brand_id, v_branch_id, 'B', 2, 25, 5, 5)
  RETURNING id INTO v_tier_b_id;

  INSERT INTO public.duelo_season_tiers (
    season_id, brand_id, branch_id, name, tier_order, target_size, promotion_count, relegation_count
  ) VALUES (v_season_id, v_brand_id, v_branch_id, 'C', 3, 25, 5, 0)
  RETURNING id INTO v_tier_c_id;

  v_low_tier_id := v_tier_c_id; -- maior tier_order

  -- ---------------------------------------------------------------------------
  -- FASE A.4 — SEEDING INLINE
  -- Replica fiel do CTE de duelo_seed_initial_tier_memberships
  -- (elegiveis -> metricas_90d -> ranqueados -> tiers_ord -> alocacao -> insert)
  -- ---------------------------------------------------------------------------
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
      MAX(r.finalized_at)               AS last_finalized_at,
      COUNT(*) FILTER (
        WHERE r.finalized_at >= now() - interval '30 days'
      )                                 AS rides_30d
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
      m.created_at,
      m.rides_90d,
      m.total_value_90d,
      m.last_finalized_at,
      (now() - m.created_at < interval '30 days') AS is_novo,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN now() - m.created_at < interval '30 days' THEN 1 ELSE 0 END ASC,
          m.rides_90d         DESC,
          m.total_value_90d   DESC,
          m.last_finalized_at DESC NULLS LAST,
          m.created_at        ASC
      ) AS rn
    FROM metricas_90d m
    WHERE m.rides_30d >= 1
       OR now() - m.created_at < interval '30 days'
  ),
  tiers_ord AS (
    SELECT
      id AS tier_id,
      tier_order,
      target_size,
      SUM(target_size) OVER (ORDER BY tier_order) AS cumul_top
    FROM public.duelo_season_tiers
    WHERE season_id = v_season_id
  ),
  alocacao AS (
    SELECT
      r.driver_id,
      r.is_novo,
      CASE
        WHEN r.is_novo THEN v_low_tier_id
        ELSE COALESCE(
          (SELECT t.tier_id FROM tiers_ord t WHERE r.rn <= t.cumul_top ORDER BY t.tier_order LIMIT 1),
          v_low_tier_id
        )
      END AS tier_id
    FROM ranqueados r
  ),
  inserted AS (
    INSERT INTO public.duelo_tier_memberships (
      season_id, tier_id, driver_id, brand_id, branch_id, source
    )
    SELECT v_season_id, a.tier_id, a.driver_id, v_brand_id, v_branch_id, 'seed'
    FROM alocacao a
    WHERE a.tier_id IS NOT NULL
    ON CONFLICT (season_id, driver_id) DO NOTHING
    RETURNING tier_id, driver_id
  ),
  agg AS (
    SELECT
      i.tier_id,
      t.name AS tier_name,
      COUNT(*) AS cnt,
      SUM(CASE WHEN a.is_novo AND i.tier_id = v_low_tier_id THEN 1 ELSE 0 END) AS overflow
    FROM inserted i
    JOIN alocacao a ON a.driver_id = i.driver_id
    JOIN public.duelo_season_tiers t ON t.id = i.tier_id
    GROUP BY i.tier_id, t.name
  )
  SELECT
    COALESCE(SUM(cnt), 0)::int,
    COALESCE(SUM(overflow), 0)::int,
    COALESCE(jsonb_object_agg(tier_name, cnt), '{}'::jsonb)
  INTO v_seeded_count, v_low_overflow_count, v_by_tier
  FROM agg;

  -- Marca seeding como concluido
  UPDATE public.duelo_seasons
     SET tier_seeding_completed_at = v_now
   WHERE id = v_season_id;

  -- ---------------------------------------------------------------------------
  -- FASE A.5 — Auditoria
  -- ---------------------------------------------------------------------------
  INSERT INTO public.duelo_attempts_log (
    code, season_id, brand_id, branch_id, details_json
  ) VALUES (
    'brand_campeonato_toggled',
    v_season_id,
    v_brand_id,
    v_branch_id,
    jsonb_build_object(
      'source',                  'manual_corrective_migration',
      'enabled',                 true,
      'engagement_format',       'campeonato',
      'tiers_config',            jsonb_build_array(
        jsonb_build_object('name','A','tier_id',v_tier_a_id,'size',25),
        jsonb_build_object('name','B','tier_id',v_tier_b_id,'size',25),
        jsonb_build_object('name','C','tier_id',v_tier_c_id,'size',25)
      ),
      'seed_result',             jsonb_build_object(
        'season_id',              v_season_id,
        'seeded_count',           v_seeded_count,
        'low_tier_overflow_count', v_low_overflow_count,
        'by_tier',                v_by_tier
      ),
      'note',                    'Ativacao corretiva via migration. Gate 3 ausente apos ativacao manual previa do Gate 2.'
    )
  );

  RAISE NOTICE 'Ativacao concluida. season_id=%, tiers=A:%/B:%/C:%, seeded_count=%, by_tier=%',
    v_season_id, v_tier_a_id, v_tier_b_id, v_tier_c_id, v_seeded_count, v_by_tier;
END
$mig$;