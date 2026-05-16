
-- ============================================================
-- C.2 — Motor de Pontuação do Campeonato Duelo (1/3)
-- ============================================================

-- 1) Tabela de auditoria do motor
CREATE TABLE IF NOT EXISTS public.duelo_attempts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  season_id uuid,
  driver_id uuid,
  brand_id uuid,
  branch_id uuid,
  ride_id uuid,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duelo_attempts_log_code_created
  ON public.duelo_attempts_log (code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_duelo_attempts_log_season
  ON public.duelo_attempts_log (season_id, created_at DESC);

ALTER TABLE public.duelo_attempts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY duelo_attempts_log_root_all
  ON public.duelo_attempts_log
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY duelo_attempts_log_brand_admin_select
  ON public.duelo_attempts_log
  FOR SELECT
  TO authenticated
  USING (
    brand_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'brand_admin'
        AND ur.brand_id = duelo_attempts_log.brand_id
    )
  );

CREATE POLICY duelo_attempts_log_branch_admin_select
  ON public.duelo_attempts_log
  FOR SELECT
  TO authenticated
  USING (
    branch_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'branch_admin'
        AND ur.branch_id = duelo_attempts_log.branch_id
    )
  );

-- 2) Função do gatilho de pontuação
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
BEGIN
  -- Só conta se virou FINALIZED agora
  IF NEW.ride_status IS DISTINCT FROM 'FINALIZED' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN
    RETURN NEW;
  END IF;

  -- Precisa ter motorista e branch
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_finalized_at := COALESCE(NEW.finalized_at, now());

  -- Temporada ativa de classificação cobrindo a corrida
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

  -- Membership do motorista nessa temporada
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

  -- Upsert atômico
  INSERT INTO public.duelo_season_standings (
    season_id, driver_id, tier_id, points, last_ride_at, qualified, relegated_auto
  )
  VALUES (
    v_season_id, NEW.driver_customer_id, v_tier_id, 1, v_finalized_at, false, false
  )
  ON CONFLICT (season_id, driver_id) DO UPDATE
    SET points = public.duelo_season_standings.points + 1,
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

DROP TRIGGER IF EXISTS trg_duelo_standings_from_ride ON public.machine_rides;
CREATE TRIGGER trg_duelo_standings_from_ride
  AFTER INSERT OR UPDATE OF ride_status, finalized_at ON public.machine_rides
  FOR EACH ROW
  EXECUTE FUNCTION public.duelo_update_standings_from_ride();

-- 3) Reconciliação diária
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

    SELECT COUNT(*)::int, MAX(mr.finalized_at)
      INTO v_expected, v_expected_last
    FROM public.machine_rides mr
    JOIN public.duelo_seasons s ON s.id = v_rec.season_id
    WHERE mr.driver_customer_id = v_rec.driver_id
      AND mr.branch_id = s.branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= s.classification_starts_at
      AND mr.finalized_at <  s.classification_ends_at;

    UPDATE public.duelo_season_standings st
       SET points = v_expected,
           last_ride_at = v_expected_last
     WHERE st.season_id = v_rec.season_id
       AND st.driver_id = v_rec.driver_id
       AND (st.points <> v_expected OR st.last_ride_at IS DISTINCT FROM v_expected_last);

    IF FOUND THEN
      v_fixed := v_fixed + 1;
      INSERT INTO public.duelo_attempts_log (code, season_id, driver_id, details_json)
      VALUES (
        'reconcile_diff',
        v_rec.season_id,
        v_rec.driver_id,
        jsonb_build_object('expected_points', v_expected, 'expected_last_ride_at', v_expected_last)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('checked', v_checked, 'fixed', v_fixed, 'window_hours', p_hours);
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_reconcile_standings(int) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_reconcile_standings(int) TO service_role;

-- 4) Backfill manual (Q5)
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
      season_id, driver_id, tier_id, points, last_ride_at, qualified, relegated_auto
    )
    VALUES (
      p_season_id, v_rec.driver_id, v_tier_id, v_rec.pts, v_rec.last_at, false, false
    )
    ON CONFLICT (season_id, driver_id) DO UPDATE
      SET points = EXCLUDED.points,
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

-- ROLLBACK (manual):
-- DROP TRIGGER IF EXISTS trg_duelo_standings_from_ride ON public.machine_rides;
-- DROP FUNCTION IF EXISTS public.duelo_update_standings_from_ride();
-- DROP FUNCTION IF EXISTS public.duelo_reconcile_standings(int);
-- DROP FUNCTION IF EXISTS public.duelo_backfill_standings(uuid);
-- DROP TABLE IF EXISTS public.duelo_attempts_log;
