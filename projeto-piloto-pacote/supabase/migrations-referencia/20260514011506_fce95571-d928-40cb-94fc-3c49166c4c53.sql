-- Permitir execução em contexto sem auth (migrations / service_role internos),
-- mantendo a checagem de papéis para chamadas autenticadas.
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

  UPDATE public.campeonato_seasons
     SET tier_seeding_completed_at = now()
   WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'seeded_count', COALESCE(v_seeded_count, 0),
    'low_tier_overflow_count', 0,
    'by_tier', COALESCE(v_by_tier, '{}'::jsonb),
    'inherited_from_prior_season', v_prior_season_id
  );
END;
$function$;

-- Re-distribui temporadas ativas já semeadas com a regra antiga.
DO $$
DECLARE v_season RECORD;
BEGIN
  PERFORM set_config('app.allow_tier_seed', 'on', true);
  FOR v_season IN
    SELECT id
    FROM public.campeonato_seasons
    WHERE phase NOT IN ('finished','cancelled')
      AND cancelled_at IS NULL
      AND tier_seeding_completed_at IS NOT NULL
  LOOP
    DELETE FROM public.campeonato_season_standings WHERE season_id = v_season.id;
    DELETE FROM public.campeonato_tier_memberships WHERE season_id = v_season.id;
    UPDATE public.campeonato_seasons SET tier_seeding_completed_at = NULL WHERE id = v_season.id;
    PERFORM public.campeonato_seed_initial_tier_memberships(v_season.id);
  END LOOP;
END $$;