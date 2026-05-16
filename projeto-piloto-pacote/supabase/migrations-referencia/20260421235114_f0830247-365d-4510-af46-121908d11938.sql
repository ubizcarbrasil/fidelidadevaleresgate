-- ============================================================
-- Tarefa B — Desempate por fim de semana + remoção de five_star_count
-- ============================================================

-- 1) Schema: nova coluna + drop do five_star_count
ALTER TABLE public.duelo_season_standings
  ADD COLUMN IF NOT EXISTS weekend_rides_count int NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS public.idx_duelo_standings_ranking;
CREATE INDEX idx_duelo_standings_ranking
  ON public.duelo_season_standings
     (season_id, points DESC, weekend_rides_count DESC, last_ride_at ASC);

ALTER TABLE public.duelo_season_standings
  DROP COLUMN IF EXISTS five_star_count;

-- 2) Helper: detecta se finalized_at cai em sex/sáb/dom no fuso da branch
CREATE OR REPLACE FUNCTION public.duelo_is_weekend_at(
  p_finalized_at timestamptz,
  p_branch_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXTRACT(DOW FROM p_finalized_at AT TIME ZONE
           COALESCE((SELECT timezone FROM public.branches WHERE id = p_branch_id),
                    'America/Sao_Paulo'))::int IN (5, 6, 0);
$$;

-- 3) Trigger de pontuação — agora também incrementa weekend_rides_count
CREATE OR REPLACE FUNCTION public.duelo_update_standings_from_ride()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_brand_id uuid;
  v_branch_id uuid;
  v_tier_id uuid;
  v_finalized_at timestamptz;
  v_is_weekend boolean;
  v_weekend_inc int;
BEGIN
  IF NEW.ride_status IS DISTINCT FROM 'FINALIZED' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN
    RETURN NEW;
  END IF;

  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_finalized_at := COALESCE(NEW.finalized_at, now());

  SELECT s.id, s.brand_id, s.branch_id
    INTO v_season_id, v_brand_id, v_branch_id
  FROM public.duelo_seasons s
  WHERE s.branch_id = NEW.branch_id
    AND s.phase = 'classification'
    AND s.classification_starts_at <= v_finalized_at
    AND s.classification_ends_at > v_finalized_at
  ORDER BY s.classification_starts_at DESC
  LIMIT 1;

  IF v_season_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT m.tier_id INTO v_tier_id
  FROM public.duelo_tier_memberships m
  WHERE m.season_id = v_season_id
    AND m.driver_id = NEW.driver_customer_id
  LIMIT 1;

  IF v_tier_id IS NULL THEN
    INSERT INTO public.duelo_attempts_log (code, season_id, driver_id, brand_id, branch_id, ride_id, details_json)
    VALUES (
      'no_membership',
      v_season_id,
      NEW.driver_customer_id,
      v_brand_id,
      v_branch_id,
      NEW.id,
      jsonb_build_object('finalized_at', v_finalized_at)
    );
    RETURN NEW;
  END IF;

  v_is_weekend := public.duelo_is_weekend_at(v_finalized_at, NEW.branch_id);
  v_weekend_inc := CASE WHEN v_is_weekend THEN 1 ELSE 0 END;

  INSERT INTO public.duelo_season_standings (
    season_id, driver_id, tier_id, points, weekend_rides_count,
    last_ride_at, qualified, relegated_auto
  )
  VALUES (
    v_season_id, NEW.driver_customer_id, v_tier_id,
    1, v_weekend_inc,
    v_finalized_at, false, false
  )
  ON CONFLICT (season_id, driver_id) DO UPDATE
    SET points = public.duelo_season_standings.points + 1,
        weekend_rides_count = public.duelo_season_standings.weekend_rides_count + v_weekend_inc,
        last_ride_at = GREATEST(
          COALESCE(public.duelo_season_standings.last_ride_at, EXCLUDED.last_ride_at),
          EXCLUDED.last_ride_at
        ),
        tier_id = COALESCE(public.duelo_season_standings.tier_id, EXCLUDED.tier_id);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.duelo_attempts_log (code, season_id, driver_id, brand_id, branch_id, ride_id, details_json)
  VALUES (
    'trigger_error',
    v_season_id,
    NEW.driver_customer_id,
    v_brand_id,
    v_branch_id,
    NEW.id,
    jsonb_build_object('sqlstate', SQLSTATE, 'message', SQLERRM)
  );
  RETURN NEW;
END;
$$;

-- 4) Reconciliação — recalcula também weekend_rides_count
CREATE OR REPLACE FUNCTION public.duelo_reconcile_standings(p_hours int DEFAULT 48)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fixed int := 0;
  v_checked int := 0;
  v_rec record;
  v_expected int;
  v_expected_weekend int;
  v_expected_last timestamptz;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT s.id AS season_id, mr.driver_customer_id AS driver_id
    FROM public.machine_rides mr
    JOIN public.duelo_seasons s
      ON s.branch_id = mr.branch_id
     AND mr.finalized_at >= s.classification_starts_at
     AND mr.finalized_at <  s.classification_ends_at
    WHERE mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= now() - make_interval(hours => p_hours)
      AND mr.driver_customer_id IS NOT NULL
      AND s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
  LOOP
    v_checked := v_checked + 1;

    SELECT
      COUNT(*)::int,
      COUNT(*) FILTER (WHERE public.duelo_is_weekend_at(mr.finalized_at, s.branch_id))::int,
      MAX(mr.finalized_at)
      INTO v_expected, v_expected_weekend, v_expected_last
    FROM public.machine_rides mr
    JOIN public.duelo_seasons s ON s.id = v_rec.season_id
    WHERE mr.driver_customer_id = v_rec.driver_id
      AND mr.branch_id = s.branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= s.classification_starts_at
      AND mr.finalized_at <  s.classification_ends_at;

    UPDATE public.duelo_season_standings st
       SET points = v_expected,
           weekend_rides_count = v_expected_weekend,
           last_ride_at = v_expected_last
     WHERE st.season_id = v_rec.season_id
       AND st.driver_id = v_rec.driver_id
       AND (st.points <> v_expected
            OR st.weekend_rides_count <> v_expected_weekend
            OR st.last_ride_at IS DISTINCT FROM v_expected_last);

    IF FOUND THEN
      v_fixed := v_fixed + 1;
      INSERT INTO public.duelo_attempts_log (code, season_id, driver_id, details_json)
      VALUES (
        'reconcile_diff',
        v_rec.season_id,
        v_rec.driver_id,
        jsonb_build_object(
          'expected_points', v_expected,
          'expected_weekend', v_expected_weekend,
          'expected_last_ride_at', v_expected_last
        )
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('checked', v_checked, 'fixed', v_fixed, 'window_hours', p_hours);
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_reconcile_standings(int) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_reconcile_standings(int) TO service_role;

-- 5) Backfill — agora calcula weekend_rides_count agregado
CREATE OR REPLACE FUNCTION public.duelo_backfill_standings(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season public.duelo_seasons%ROWTYPE;
  v_inserted int := 0;
  v_updated int := 0;
  v_skipped_no_membership int := 0;
  v_rec record;
  v_tier_id uuid;
  v_until timestamptz;
BEGIN
  SELECT * INTO v_season FROM public.duelo_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_season.phase NOT IN ('classification') THEN
    RAISE EXCEPTION 'Backfill só permitido em fase classification (atual: %)', v_season.phase;
  END IF;

  v_until := LEAST(now(), v_season.classification_ends_at);

  FOR v_rec IN
    SELECT mr.driver_customer_id AS driver_id,
           COUNT(*)::int AS pts,
           COUNT(*) FILTER (
             WHERE public.duelo_is_weekend_at(mr.finalized_at, v_season.branch_id)
           )::int AS weekend_pts,
           MAX(mr.finalized_at) AS last_at
    FROM public.machine_rides mr
    WHERE mr.branch_id = v_season.branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.driver_customer_id IS NOT NULL
      AND mr.finalized_at >= v_season.classification_starts_at
      AND mr.finalized_at <  v_until
    GROUP BY mr.driver_customer_id
  LOOP
    SELECT m.tier_id INTO v_tier_id
    FROM public.duelo_tier_memberships m
    WHERE m.season_id = p_season_id AND m.driver_id = v_rec.driver_id
    LIMIT 1;

    IF v_tier_id IS NULL THEN
      v_skipped_no_membership := v_skipped_no_membership + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.duelo_season_standings (
      season_id, driver_id, tier_id, points, weekend_rides_count,
      last_ride_at, qualified, relegated_auto
    )
    VALUES (
      p_season_id, v_rec.driver_id, v_tier_id,
      v_rec.pts, v_rec.weekend_pts,
      v_rec.last_at, false, false
    )
    ON CONFLICT (season_id, driver_id) DO UPDATE
      SET points = EXCLUDED.points,
          weekend_rides_count = EXCLUDED.weekend_rides_count,
          last_ride_at = EXCLUDED.last_ride_at,
          tier_id = COALESCE(public.duelo_season_standings.tier_id, EXCLUDED.tier_id);

    IF FOUND THEN
      v_updated := v_updated + 1;
    ELSE
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES (
    'backfill_done',
    p_season_id,
    v_season.brand_id,
    v_season.branch_id,
    jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'skipped_no_membership', v_skipped_no_membership, 'until', v_until)
  );

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'inserted', v_inserted,
    'updated', v_updated,
    'skipped_no_membership', v_skipped_no_membership,
    'until', v_until
  );
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_backfill_standings(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_backfill_standings(uuid) TO authenticated, service_role;

-- 6) Criação de brackets dentro do tier — nova ordem de seed
CREATE OR REPLACE FUNCTION public.duelo_create_brackets_within_tier(
  p_season_id uuid,
  p_tier_id uuid,
  p_round text,
  p_top_n int,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seeds uuid[];
  v_count int;
  v_i int;
  v_a uuid;
  v_b uuid;
  v_brackets int := 0;
BEGIN
  WITH ranked AS (
    SELECT st.driver_id,
           ROW_NUMBER() OVER (
             ORDER BY st.points DESC NULLS LAST,
                      st.weekend_rides_count DESC NULLS LAST,
                      st.last_ride_at ASC NULLS LAST
           ) AS pos
    FROM public.duelo_season_standings st
    WHERE st.season_id = p_season_id
      AND st.tier_id = p_tier_id
  ),
  upd AS (
    UPDATE public.duelo_season_standings st
       SET position_in_tier = r.pos,
           qualified = (r.pos <= p_top_n)
      FROM ranked r
     WHERE st.season_id = p_season_id
       AND st.tier_id = p_tier_id
       AND st.driver_id = r.driver_id
     RETURNING st.driver_id, r.pos
  )
  SELECT array_agg(driver_id ORDER BY pos) INTO v_seeds
    FROM upd
   WHERE pos <= p_top_n;

  v_count := COALESCE(array_length(v_seeds, 1), 0);
  IF v_count < 2 THEN
    RETURN 0;
  END IF;

  FOR v_i IN 1 .. (v_count / 2) LOOP
    v_a := v_seeds[v_i];
    v_b := v_seeds[v_count - v_i + 1];
    INSERT INTO public.duelo_brackets (
      season_id, round, slot, driver_a_id, driver_b_id,
      driver_a_rides, driver_b_rides, starts_at, ends_at, tier_id, bracket_scope
    )
    VALUES (
      p_season_id, p_round, v_i, v_a, v_b,
      0, 0, p_starts_at, p_ends_at, p_tier_id, 'within_tier'
    );
    v_brackets := v_brackets + 1;
  END LOOP;

  RETURN v_brackets;
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_create_brackets_within_tier(uuid,uuid,text,int,timestamptz,timestamptz) FROM public;

-- 7) Promoção/Rebaixamento — nova ordem no ranqueamento final
CREATE OR REPLACE FUNCTION public.duelo_apply_promotion_relegation(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season public.duelo_seasons%ROWTYPE;
  v_tier record;
  v_next_tier_id uuid;
  v_prev_tier_id uuid;
  v_max_order int;
  v_min_order int;
  v_zero_relegated int := 0;
  v_relegated int := 0;
  v_promoted int := 0;
  v_stayed int := 0;
  v_d record;
BEGIN
  SELECT * INTO v_season FROM public.duelo_seasons WHERE id = p_season_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada % não encontrada', p_season_id;
  END IF;

  IF v_season.phase <> 'finished' THEN
    RAISE EXCEPTION 'Promoção/rebaixamento só aplica em fase finished (atual: %)', v_season.phase;
  END IF;

  IF v_season.promotion_applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already_applied', 'at', v_season.promotion_applied_at);
  END IF;

  SELECT MAX(tier_order), MIN(tier_order)
    INTO v_max_order, v_min_order
    FROM public.duelo_season_tiers
   WHERE season_id = p_season_id;

  -- position_in_tier final com novo desempate
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY tier_id
             ORDER BY points DESC NULLS LAST,
                      weekend_rides_count DESC NULLS LAST,
                      last_ride_at ASC NULLS LAST
           ) AS pos
      FROM public.duelo_season_standings
     WHERE season_id = p_season_id
  )
  UPDATE public.duelo_season_standings st
     SET position_in_tier = r.pos
    FROM ranked r
   WHERE st.id = r.id
     AND (st.position_in_tier IS NULL OR st.position_in_tier <> r.pos);

  -- ETAPA 1: rebaixamento por zero pontos
  FOR v_tier IN
    SELECT * FROM public.duelo_season_tiers
     WHERE season_id = p_season_id
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_next_tier_id
      FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order + 1;

    FOR v_d IN
      SELECT st.driver_id, st.id AS standing_id
        FROM public.duelo_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.points, 0) = 0
    LOOP
      UPDATE public.duelo_season_standings
         SET relegated_auto = true
       WHERE id = v_d.standing_id;

      INSERT INTO public.duelo_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      SELECT p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
             v_tier.id, COALESCE(v_next_tier_id, v_tier.id), st.position_in_tier,
             CASE WHEN v_next_tier_id IS NULL THEN 'stayed' ELSE 'relegated_zero' END
        FROM public.duelo_season_standings st
       WHERE st.id = v_d.standing_id
      ON CONFLICT DO NOTHING;

      v_zero_relegated := v_zero_relegated + 1;
    END LOOP;
  END LOOP;

  -- ETAPA 2: rebaixamento normal
  FOR v_tier IN
    SELECT * FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order < v_max_order
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_next_tier_id
      FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order + 1;

    FOR v_d IN
      SELECT st.driver_id, st.position_in_tier
        FROM public.duelo_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.relegated_auto,false) = false
       ORDER BY st.position_in_tier DESC NULLS FIRST
       LIMIT v_tier.relegation_count
    LOOP
      INSERT INTO public.duelo_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      VALUES (
        p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
        v_tier.id, v_next_tier_id, v_d.position_in_tier, 'relegated'
      )
      ON CONFLICT DO NOTHING;
      v_relegated := v_relegated + 1;
    END LOOP;
  END LOOP;

  -- ETAPA 3: promoção
  FOR v_tier IN
    SELECT * FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order > v_min_order
     ORDER BY tier_order
  LOOP
    SELECT id INTO v_prev_tier_id
      FROM public.duelo_season_tiers
     WHERE season_id = p_season_id AND tier_order = v_tier.tier_order - 1;

    FOR v_d IN
      SELECT st.driver_id, st.position_in_tier, st.tier_id AS source_tier_id
        FROM public.duelo_season_standings st
       WHERE st.season_id = p_season_id
         AND st.tier_id = v_tier.id
         AND COALESCE(st.relegated_auto,false) = false
         AND NOT EXISTS (
           SELECT 1 FROM public.duelo_driver_tier_history h
            WHERE h.season_id = p_season_id
              AND h.driver_id = st.driver_id
         )
       ORDER BY st.position_in_tier ASC NULLS LAST
       LIMIT (
         SELECT promotion_count FROM public.duelo_season_tiers WHERE id = v_tier.id
       )
    LOOP
      INSERT INTO public.duelo_driver_tier_history (
        season_id, driver_id, brand_id, branch_id,
        starting_tier_id, ending_tier_id, ending_position, outcome
      )
      VALUES (
        p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
        v_tier.id, v_prev_tier_id, v_d.position_in_tier, 'promoted'
      )
      ON CONFLICT DO NOTHING;
      v_promoted := v_promoted + 1;
    END LOOP;
  END LOOP;

  -- ETAPA 4: stayed + champion do tier 1
  FOR v_d IN
    SELECT st.driver_id, st.tier_id, st.position_in_tier, t.tier_order
      FROM public.duelo_season_standings st
      JOIN public.duelo_season_tiers t ON t.id = st.tier_id
     WHERE st.season_id = p_season_id
       AND NOT EXISTS (
         SELECT 1 FROM public.duelo_driver_tier_history h
          WHERE h.season_id = p_season_id AND h.driver_id = st.driver_id
       )
  LOOP
    INSERT INTO public.duelo_driver_tier_history (
      season_id, driver_id, brand_id, branch_id,
      starting_tier_id, ending_tier_id, ending_position, outcome
    )
    VALUES (
      p_season_id, v_d.driver_id, v_season.brand_id, v_season.branch_id,
      v_d.tier_id, v_d.tier_id, v_d.position_in_tier,
      CASE WHEN v_d.tier_order = v_min_order AND v_d.position_in_tier = 1 THEN 'champion'
           ELSE 'stayed' END
    )
    ON CONFLICT DO NOTHING;
    v_stayed := v_stayed + 1;
  END LOOP;

  UPDATE public.duelo_seasons
     SET promotion_applied_at = now(),
         updated_at = now()
   WHERE id = p_season_id;

  INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES ('promotion_applied', p_season_id, v_season.brand_id, v_season.branch_id,
          jsonb_build_object(
            'zero_relegated', v_zero_relegated,
            'relegated', v_relegated,
            'promoted', v_promoted,
            'stayed', v_stayed
          ));

  RETURN jsonb_build_object(
    'season_id', p_season_id,
    'zero_relegated', v_zero_relegated,
    'relegated', v_relegated,
    'promoted', v_promoted,
    'stayed', v_stayed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_apply_promotion_relegation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_apply_promotion_relegation(uuid) TO authenticated, service_role;

-- 8) Backfill retroativo: popula weekend_rides_count em standings de temporadas ativas
WITH agregado AS (
  SELECT st.id,
         COUNT(*) FILTER (
           WHERE mr.ride_status = 'FINALIZED'
             AND public.duelo_is_weekend_at(mr.finalized_at, s.branch_id)
         )::int AS weekend_count
    FROM public.duelo_season_standings st
    JOIN public.duelo_seasons s ON s.id = st.season_id
    LEFT JOIN public.machine_rides mr
      ON mr.driver_customer_id = st.driver_id
     AND mr.branch_id = s.branch_id
     AND mr.finalized_at >= s.classification_starts_at
     AND mr.finalized_at <  s.classification_ends_at
   WHERE s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
   GROUP BY st.id
)
UPDATE public.duelo_season_standings st
   SET weekend_rides_count = a.weekend_count
  FROM agregado a
 WHERE st.id = a.id
   AND st.weekend_rides_count <> a.weekend_count;

-- ============================================================
-- ROLLBACK (manual, em transação):
-- BEGIN;
-- ALTER TABLE public.duelo_season_standings ADD COLUMN IF NOT EXISTS five_star_count int NOT NULL DEFAULT 0;
-- DROP INDEX IF EXISTS public.idx_duelo_standings_ranking;
-- CREATE INDEX idx_duelo_standings_ranking ON public.duelo_season_standings (season_id, points DESC, five_star_count DESC, last_ride_at ASC);
-- -- Reaplicar versões anteriores das funções a partir das migrations:
-- --   20260421230612 (duelo_update_standings_from_ride, duelo_reconcile_standings, duelo_backfill_standings)
-- --   20260421230750 (duelo_create_brackets_within_tier)
-- --   20260421230850 (duelo_apply_promotion_relegation)
-- DROP FUNCTION IF EXISTS public.duelo_is_weekend_at(timestamptz, uuid);
-- ALTER TABLE public.duelo_season_standings DROP COLUMN IF EXISTS weekend_rides_count;
-- COMMIT;
-- + git revert do commit TS (tipos_campeonato.ts, servico_campeonato.ts, tabela_classificacao.tsx)
-- ============================================================