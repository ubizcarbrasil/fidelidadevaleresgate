-- ============================================================
-- C.4: Admin do Campeonato (formato + ciclo de vida + intervenções)
-- ============================================================

-- 0) Schema
ALTER TABLE public.duelo_seasons
  DROP CONSTRAINT IF EXISTS duelo_seasons_phase_check;
ALTER TABLE public.duelo_seasons
  ADD CONSTRAINT duelo_seasons_phase_check
  CHECK (phase IN ('classification','knockout_r16','knockout_qf',
                   'knockout_sf','knockout_final','finished','cancelled'));
ALTER TABLE public.duelo_seasons
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE INDEX IF NOT EXISTS idx_duelo_seasons_active_for_motor
  ON public.duelo_seasons(brand_id, branch_id)
  WHERE phase NOT IN ('finished','cancelled') AND paused_at IS NULL;

-- Helper de autorização (DRY) — usa IN (SELECT ...) porque get_user_brand_ids retorna SETOF uuid
CREATE OR REPLACE FUNCTION public.duelo_admin_can_manage(p_brand_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    has_role(auth.uid(),'root_admin')
    OR (has_role(auth.uid(),'brand_admin')
        AND p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));
$$;

-- Trigger duelo_update_standings_from_ride: respeitar paused_at
CREATE OR REPLACE FUNCTION public.duelo_update_standings_from_ride()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_tier_id uuid;
  v_finalized_at timestamptz;
  v_is_weekend boolean;
  v_brand_id uuid;
BEGIN
  IF NEW.ride_status <> 'FINALIZED' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN RETURN NEW; END IF;
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;
  SELECT brand_id INTO v_brand_id FROM public.branches WHERE id = NEW.branch_id;
  IF public.duelo_get_engagement_format(v_brand_id) <> 'campeonato' THEN
    RETURN NEW;
  END IF;
  v_finalized_at := COALESCE(NEW.finalized_at, now());
  v_is_weekend := public.duelo_is_weekend_at(v_finalized_at, NEW.branch_id);
  SELECT s.id INTO v_season_id
    FROM public.duelo_seasons s
   WHERE s.branch_id = NEW.branch_id
     AND s.phase = 'classification'
     AND s.paused_at IS NULL
     AND v_finalized_at >= s.classification_starts_at
     AND v_finalized_at <  s.classification_ends_at
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season_id IS NULL THEN RETURN NEW; END IF;
  SELECT tm.tier_id INTO v_tier_id FROM public.duelo_tier_memberships tm
   WHERE tm.season_id = v_season_id AND tm.driver_id = NEW.driver_customer_id LIMIT 1;
  IF v_tier_id IS NULL THEN
    INSERT INTO public.duelo_attempts_log(code, season_id, driver_id, details_json)
      VALUES ('no_membership', v_season_id, NEW.driver_customer_id, jsonb_build_object('ride_id', NEW.id));
    RETURN NEW;
  END IF;
  INSERT INTO public.duelo_season_standings(
    season_id, driver_id, tier_id, points, weekend_rides_count, last_ride_at, qualified, relegated_auto)
  VALUES (v_season_id, NEW.driver_customer_id, v_tier_id, 1,
    CASE WHEN v_is_weekend THEN 1 ELSE 0 END, v_finalized_at, false, false)
  ON CONFLICT (season_id, driver_id) DO UPDATE
     SET points = public.duelo_season_standings.points + 1,
         weekend_rides_count = public.duelo_season_standings.weekend_rides_count
                             + CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
         last_ride_at = GREATEST(
           COALESCE(public.duelo_season_standings.last_ride_at, EXCLUDED.last_ride_at),
           EXCLUDED.last_ride_at),
         tier_id = COALESCE(public.duelo_season_standings.tier_id, EXCLUDED.tier_id);
  RETURN NEW;
END;
$$;

-- duelo_advance_phases: filtrar paused_at + cancelled
CREATE OR REPLACE FUNCTION public.duelo_advance_phases()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary jsonb := '[]'::jsonb;
  v_season record; v_tier record; v_total int; v_top int; v_round text;
  v_next_phase text; v_brackets int; v_phase_starts timestamptz; v_phase_ends timestamptz;
  v_round_total int; v_round_done int; v_b record; v_winner uuid; v_next_round text;
  v_pair record; v_slot int; v_champion uuid; v_runner_up uuid;
  v_semis uuid[]; v_qf uuid[]; v_r16 uuid[];
BEGIN
  FOR v_season IN
    SELECT s.*, COALESCE(b.timezone, 'America/Sao_Paulo') AS tz
      FROM public.duelo_seasons s
      JOIN public.branches b ON b.id = s.branch_id
     WHERE s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
       AND s.paused_at IS NULL
       AND public.duelo_get_engagement_format(s.brand_id) = 'campeonato'
  LOOP
    BEGIN
      IF v_season.phase = 'classification' AND now() >= v_season.classification_ends_at THEN
        v_phase_starts := GREATEST(now(), v_season.knockout_starts_at);
        v_phase_ends   := v_season.knockout_ends_at;
        v_next_phase   := NULL;
        FOR v_tier IN SELECT t.* FROM public.duelo_season_tiers t
           WHERE t.season_id = v_season.id AND t.aborted_at IS NULL ORDER BY t.tier_order
        LOOP
          SELECT COUNT(*) INTO v_total FROM public.duelo_season_standings st
           WHERE st.season_id = v_season.id AND st.tier_id = v_tier.id AND st.points >= 1;
          IF v_total >= 16 THEN v_top := 16; v_round := 'knockout_r16';
          ELSIF v_total >= 8 THEN v_top := 8; v_round := 'knockout_qf';
          ELSIF v_total >= 4 THEN v_top := 4; v_round := 'knockout_sf';
          ELSIF v_total >= 2 THEN v_top := 2; v_round := 'knockout_final';
          ELSE
            UPDATE public.duelo_season_tiers SET aborted_at = now() WHERE id = v_tier.id;
            INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
            VALUES ('tier_aborted', v_season.id, v_season.brand_id, v_season.branch_id,
                    jsonb_build_object('tier_id', v_tier.id, 'reason', 'less_than_2_qualified'));
            CONTINUE;
          END IF;
          v_brackets := public.duelo_create_brackets_within_tier(
            v_season.id, v_tier.id,
            CASE v_round WHEN 'knockout_r16' THEN 'r16' WHEN 'knockout_qf' THEN 'qf'
                 WHEN 'knockout_sf' THEN 'sf' ELSE 'final' END,
            v_top, v_phase_starts, v_phase_ends);
          IF v_next_phase IS NULL OR (v_round = 'knockout_r16')
             OR (v_round = 'knockout_qf' AND v_next_phase NOT IN ('knockout_r16'))
             OR (v_round = 'knockout_sf' AND v_next_phase NOT IN ('knockout_r16','knockout_qf'))
             OR (v_round = 'knockout_final' AND v_next_phase = 'knockout_final')
          THEN v_next_phase := v_round; END IF;
        END LOOP;
        IF v_next_phase IS NOT NULL THEN
          UPDATE public.duelo_seasons SET phase = v_next_phase, updated_at = now() WHERE id = v_season.id;
          INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
          VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                  jsonb_build_object('from','classification','to', v_next_phase));
          v_summary := v_summary || jsonb_build_object('season_id', v_season.id, 'to', v_next_phase);
        ELSE
          UPDATE public.duelo_seasons SET phase = 'finished', updated_at = now() WHERE id = v_season.id;
          INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
          VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                  jsonb_build_object('from','classification','to','finished','reason','no_tier_eligible'));
        END IF;
        CONTINUE;
      END IF;
      IF v_season.phase IN ('knockout_r16','knockout_qf','knockout_sf','knockout_final') THEN
        v_round := CASE v_season.phase WHEN 'knockout_r16' THEN 'r16' WHEN 'knockout_qf' THEN 'qf'
          WHEN 'knockout_sf' THEN 'sf' ELSE 'final' END;
        SELECT COUNT(*), COUNT(*) FILTER (WHERE winner_id IS NOT NULL OR ends_at <= now())
          INTO v_round_total, v_round_done
          FROM public.duelo_brackets WHERE season_id = v_season.id AND round = v_round;
        IF v_round_total = 0 OR v_round_done < v_round_total THEN CONTINUE; END IF;
        FOR v_b IN SELECT * FROM public.duelo_brackets
           WHERE season_id = v_season.id AND round = v_round AND winner_id IS NULL
        LOOP
          IF v_b.driver_a_id IS NULL THEN v_winner := v_b.driver_b_id;
          ELSIF v_b.driver_b_id IS NULL THEN v_winner := v_b.driver_a_id;
          ELSIF v_b.driver_a_rides > v_b.driver_b_rides THEN v_winner := v_b.driver_a_id;
          ELSIF v_b.driver_b_rides > v_b.driver_a_rides THEN v_winner := v_b.driver_b_id;
          ELSE
            SELECT driver_id INTO v_winner FROM public.duelo_season_standings
             WHERE season_id = v_season.id AND driver_id IN (v_b.driver_a_id, v_b.driver_b_id)
             ORDER BY position_in_tier ASC NULLS LAST, points DESC, last_ride_at ASC LIMIT 1;
          END IF;
          UPDATE public.duelo_brackets SET winner_id = v_winner WHERE id = v_b.id;
        END LOOP;
        IF v_round = 'final' THEN
          SELECT b.winner_id, CASE WHEN b.driver_a_id = b.winner_id THEN b.driver_b_id ELSE b.driver_a_id END
            INTO v_champion, v_runner_up
            FROM public.duelo_brackets b
            JOIN public.duelo_season_tiers t ON t.id = b.tier_id
           WHERE b.season_id = v_season.id AND b.round = 'final'
           ORDER BY t.tier_order ASC LIMIT 1;
          SELECT array_agg(driver_id) INTO v_semis FROM (
            SELECT DISTINCT unnest(ARRAY[b.driver_a_id, b.driver_b_id]) AS driver_id
              FROM public.duelo_brackets b JOIN public.duelo_season_tiers t ON t.id = b.tier_id
             WHERE b.season_id = v_season.id AND b.round = 'sf' AND t.tier_order = 1
          ) s WHERE driver_id IS NOT NULL;
          SELECT array_agg(driver_id) INTO v_qf FROM (
            SELECT DISTINCT unnest(ARRAY[b.driver_a_id, b.driver_b_id]) AS driver_id
              FROM public.duelo_brackets b JOIN public.duelo_season_tiers t ON t.id = b.tier_id
             WHERE b.season_id = v_season.id AND b.round = 'qf' AND t.tier_order = 1
          ) s WHERE driver_id IS NOT NULL;
          SELECT array_agg(driver_id) INTO v_r16 FROM (
            SELECT DISTINCT unnest(ARRAY[b.driver_a_id, b.driver_b_id]) AS driver_id
              FROM public.duelo_brackets b JOIN public.duelo_season_tiers t ON t.id = b.tier_id
             WHERE b.season_id = v_season.id AND b.round = 'r16' AND t.tier_order = 1
          ) s WHERE driver_id IS NOT NULL;
          INSERT INTO public.duelo_champions (season_id, brand_id, branch_id,
            champion_driver_id, runner_up_driver_id, semifinalist_ids, quarterfinalist_ids, r16_ids,
            prizes_distributed, finalized_at)
          VALUES (v_season.id, v_season.brand_id, v_season.branch_id,
            v_champion, v_runner_up,
            COALESCE(v_semis, ARRAY[]::uuid[]),
            COALESCE(v_qf,    ARRAY[]::uuid[]),
            COALESCE(v_r16,   ARRAY[]::uuid[]),
            false, now())
          ON CONFLICT DO NOTHING;
          UPDATE public.duelo_seasons SET phase = 'finished', updated_at = now() WHERE id = v_season.id;
          INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
          VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                  jsonb_build_object('from', v_season.phase, 'to', 'finished'));
          PERFORM public.duelo_apply_promotion_relegation(v_season.id);
          v_summary := v_summary || jsonb_build_object('season_id', v_season.id, 'to', 'finished');
          CONTINUE;
        END IF;
        v_next_round := CASE v_round WHEN 'r16' THEN 'qf' WHEN 'qf' THEN 'sf' ELSE 'final' END;
        v_next_phase := 'knockout_' || v_next_round;
        FOR v_tier IN SELECT DISTINCT tier_id FROM public.duelo_brackets
           WHERE season_id = v_season.id AND round = v_round AND tier_id IS NOT NULL
        LOOP
          v_slot := 0;
          FOR v_pair IN SELECT winner_id, slot FROM public.duelo_brackets
             WHERE season_id = v_season.id AND round = v_round AND tier_id = v_tier.tier_id ORDER BY slot
          LOOP
            v_slot := v_slot + 1;
            IF v_slot % 2 = 1 THEN v_winner := v_pair.winner_id;
            ELSE
              INSERT INTO public.duelo_brackets (season_id, round, slot, driver_a_id, driver_b_id,
                driver_a_rides, driver_b_rides, starts_at, ends_at, tier_id, bracket_scope)
              VALUES (v_season.id, v_next_round, (v_slot/2),
                v_winner, v_pair.winner_id, 0, 0, now(), v_season.knockout_ends_at,
                v_tier.tier_id, 'within_tier');
            END IF;
          END LOOP;
        END LOOP;
        UPDATE public.duelo_seasons SET phase = v_next_phase, updated_at = now() WHERE id = v_season.id;
        INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
        VALUES ('phase_advanced', v_season.id, v_season.brand_id, v_season.branch_id,
                jsonb_build_object('from', v_season.phase, 'to', v_next_phase));
        v_summary := v_summary || jsonb_build_object('season_id', v_season.id, 'to', v_next_phase);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
      VALUES ('advance_error', v_season.id, v_season.brand_id, v_season.branch_id,
              jsonb_build_object('sqlstate', SQLSTATE, 'message', SQLERRM, 'phase', v_season.phase));
    END;
  END LOOP;
  RETURN jsonb_build_object('processed', v_summary);
END;
$$;
REVOKE ALL ON FUNCTION public.duelo_advance_phases() FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_advance_phases() TO authenticated, service_role;

-- 5 RPCs de mutação
CREATE OR REPLACE FUNCTION public.duelo_cancel_season(p_season_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid; v_phase text;
BEGIN
  SELECT brand_id, phase INTO v_brand, v_phase FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.duelo_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN
    RAISE EXCEPTION 'Temporada já finalizada ou cancelada';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)';
  END IF;
  UPDATE public.duelo_seasons
     SET phase = 'cancelled', cancelled_at = now(),
         cancellation_reason = p_reason, updated_at = now()
   WHERE id = p_season_id;
  INSERT INTO public.duelo_attempts_log(code, season_id, brand_id, details_json)
    VALUES ('season_cancelled', p_season_id, v_brand,
      jsonb_build_object('reason', p_reason, 'cancelled_by', auth.uid()));
  RETURN jsonb_build_object('season_id', p_season_id, 'cancelled_at', now());
END; $$;

CREATE OR REPLACE FUNCTION public.duelo_pause_season(p_season_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid; v_phase text;
BEGIN
  SELECT brand_id, phase INTO v_brand, v_phase FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.duelo_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN
    RAISE EXCEPTION 'Temporada não pode ser pausada nesta fase';
  END IF;
  UPDATE public.duelo_seasons SET paused_at = now(), updated_at = now()
   WHERE id = p_season_id AND paused_at IS NULL;
  INSERT INTO public.duelo_attempts_log(code, season_id, brand_id, details_json)
    VALUES ('season_paused', p_season_id, v_brand,
      jsonb_build_object('paused_by', auth.uid()));
  RETURN jsonb_build_object('paused_at', now());
END; $$;

CREATE OR REPLACE FUNCTION public.duelo_resume_season(p_season_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid;
BEGIN
  SELECT brand_id INTO v_brand FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.duelo_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  UPDATE public.duelo_seasons SET paused_at = NULL, updated_at = now()
   WHERE id = p_season_id;
  INSERT INTO public.duelo_attempts_log(code, season_id, brand_id, details_json)
    VALUES ('season_resumed', p_season_id, v_brand,
      jsonb_build_object('resumed_by', auth.uid()));
  RETURN jsonb_build_object('resumed_at', now());
END; $$;

CREATE OR REPLACE FUNCTION public.duelo_update_prize(
  p_brand_id uuid, p_tier_name text, p_position text, p_new_points int
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old int;
BEGIN
  IF NOT public.duelo_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF p_new_points < 0 OR p_new_points > 100000 THEN
    RAISE EXCEPTION 'Pontos fora do intervalo permitido (0 a 100000)';
  END IF;
  SELECT points_reward INTO v_old FROM public.brand_duelo_prizes
    WHERE brand_id = p_brand_id AND tier_name = p_tier_name AND position = p_position;
  IF v_old IS NULL THEN
    INSERT INTO public.brand_duelo_prizes(brand_id, tier_name, position, points_reward, updated_by)
      VALUES (p_brand_id, p_tier_name, p_position, p_new_points, auth.uid());
  ELSE
    UPDATE public.brand_duelo_prizes
       SET points_reward = p_new_points, updated_by = auth.uid(), updated_at = now()
     WHERE brand_id = p_brand_id AND tier_name = p_tier_name AND position = p_position;
  END IF;
  INSERT INTO public.duelo_attempts_log(code, brand_id, details_json)
    VALUES ('prize_adjusted', p_brand_id,
      jsonb_build_object('tier_name', p_tier_name, 'position', p_position,
        'old_value', v_old, 'new_value', p_new_points, 'changed_by', auth.uid()));
  RETURN jsonb_build_object('previous', v_old, 'new', p_new_points);
END; $$;

CREATE OR REPLACE FUNCTION public.duelo_add_driver_to_season(
  p_season_id uuid, p_driver_id uuid, p_tier_id uuid,
  p_initial_points int DEFAULT 0, p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid; v_branch uuid; v_phase text; v_median numeric;
        v_belongs boolean; v_tier_belongs boolean;
BEGIN
  SELECT brand_id, branch_id, phase INTO v_brand, v_branch, v_phase
    FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.duelo_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN
    RAISE EXCEPTION 'Temporada não editável (fase: %)', v_phase;
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)';
  END IF;
  IF p_initial_points < 0 THEN
    RAISE EXCEPTION 'initial_points não pode ser negativo';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.duelo_season_tiers
                 WHERE id = p_tier_id AND season_id = p_season_id) INTO v_tier_belongs;
  IF NOT v_tier_belongs THEN RAISE EXCEPTION 'Série não pertence a esta temporada'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.customers
                 WHERE id = p_driver_id AND brand_id = v_brand) INTO v_belongs;
  IF NOT v_belongs THEN RAISE EXCEPTION 'Motorista não pertence à marca'; END IF;
  IF EXISTS(SELECT 1 FROM public.duelo_tier_memberships
            WHERE season_id = p_season_id AND driver_id = p_driver_id) THEN
    RAISE EXCEPTION 'Motorista já está nesta temporada';
  END IF;
  SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY points), 0)
    INTO v_median FROM public.duelo_season_standings
   WHERE season_id = p_season_id AND tier_id = p_tier_id;
  IF p_initial_points::numeric > v_median THEN
    RAISE EXCEPTION 'initial_points (%) excede mediana da série (%) — bloqueado por antifraude',
      p_initial_points, v_median;
  END IF;
  INSERT INTO public.duelo_tier_memberships(season_id, driver_id, tier_id,
    brand_id, branch_id, source)
    VALUES (p_season_id, p_driver_id, p_tier_id, v_brand, v_branch, 'manual_add');
  INSERT INTO public.duelo_season_standings(season_id, driver_id, tier_id,
    points, weekend_rides_count, qualified, relegated_auto)
    VALUES (p_season_id, p_driver_id, p_tier_id,
      p_initial_points, 0, false, false);
  INSERT INTO public.duelo_attempts_log(code, season_id, driver_id, brand_id, details_json)
    VALUES ('manual_driver_added', p_season_id, p_driver_id, v_brand,
      jsonb_build_object('tier_id', p_tier_id, 'initial_points', p_initial_points,
        'median', v_median, 'reason', p_reason, 'added_by', auth.uid()));
  RETURN jsonb_build_object('membership_created', true, 'median_at_insert', v_median);
END; $$;

-- 6 RPCs de leitura
CREATE OR REPLACE FUNCTION public.brand_get_campeonato_dashboard(p_brand_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_active jsonb; v_tiers jsonb; v_season_id uuid;
BEGIN
  IF NOT public.duelo_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
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
    FROM public.duelo_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season_id IS NULL THEN
    RETURN jsonb_build_object('active_season', NULL, 'tiers', '[]'::jsonb);
  END IF;
  WITH tier_top AS (
    SELECT t.id AS tier_id, t.name AS tier_name, t.tier_order,
           t.target_size, t.promotion_count, t.relegation_count,
      (SELECT COUNT(*)::int FROM public.duelo_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id) AS total_drivers,
      (SELECT COUNT(*)::int FROM public.duelo_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id AND st2.qualified = true) AS qualified_count,
      (SELECT jsonb_agg(jsonb_build_object(
          'driver_id', x.driver_id, 'driver_name', x.driver_name,
          'points', x.points, 'weekend_rides_count', x.weekend_rides_count
        ) ORDER BY x.rn)
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                             COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
                 st.driver_id, c.name AS driver_name, st.points, st.weekend_rides_count
            FROM public.duelo_season_standings st
            JOIN public.customers c ON c.id = st.driver_id
           WHERE st.season_id = v_season_id AND st.tier_id = t.id
        ) x WHERE x.rn <= 3) AS top3
      FROM public.duelo_season_tiers t WHERE t.season_id = v_season_id
     ORDER BY t.tier_order)
  SELECT jsonb_agg(jsonb_build_object(
    'tier_id', tier_id, 'tier_name', tier_name, 'tier_order', tier_order,
    'target_size', target_size, 'promotion_count', promotion_count,
    'relegation_count', relegation_count, 'total_drivers', total_drivers,
    'qualified_count', qualified_count, 'top3', COALESCE(top3,'[]'::jsonb)
  ) ORDER BY tier_order) INTO v_tiers FROM tier_top;
  RETURN jsonb_build_object('active_season', v_active, 'tiers', COALESCE(v_tiers,'[]'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.brand_get_seasons_list(
  p_brand_id uuid, p_status text DEFAULT 'all'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.duelo_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_ends_at', s.knockout_ends_at,
    'created_at', s.created_at, 'branch_id', s.branch_id
  ) ORDER BY s.year DESC, s.month DESC) INTO v_result
    FROM public.duelo_seasons s
   WHERE s.brand_id = p_brand_id
     AND CASE
           WHEN p_status = 'active' THEN s.phase NOT IN ('finished','cancelled')
           WHEN p_status = 'finished' THEN s.phase = 'finished'
           WHEN p_status = 'cancelled' THEN s.phase = 'cancelled'
           ELSE TRUE
         END;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.brand_get_series_detail(
  p_season_id uuid, p_tier_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.duelo_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  WITH ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                       COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
           st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at,
           st.qualified, c.name AS driver_name
      FROM public.duelo_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = p_tier_id)
  SELECT jsonb_agg(jsonb_build_object(
    'position', rn, 'driver_id', driver_id, 'driver_name', driver_name,
    'points', points, 'weekend_rides_count', weekend_rides_count,
    'last_ride_at', last_ride_at, 'qualified', qualified
  ) ORDER BY rn) INTO v_result FROM ranked;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.brand_get_brackets_full(p_season_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.duelo_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'bracket_id', b.id, 'tier_id', b.tier_id, 'tier_name', t.name, 'tier_order', t.tier_order,
    'round', b.round, 'slot', b.slot,
    'starts_at', b.starts_at, 'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id, 'driver_a_name', ca.name, 'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id, 'driver_b_name', cb.name, 'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id
  ) ORDER BY t.tier_order,
    CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END, b.slot
  ) INTO v_result
    FROM public.duelo_brackets b
    LEFT JOIN public.duelo_season_tiers t ON t.id = b.tier_id
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.brand_get_season_summary(p_season_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.duelo_admin_can_manage(v_brand) THEN
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
        'total_drivers', (SELECT COUNT(*)::int FROM public.duelo_season_standings
                            WHERE season_id = s.id AND tier_id = t.id),
        'qualified_count', (SELECT COUNT(*)::int FROM public.duelo_season_standings
                              WHERE season_id = s.id AND tier_id = t.id AND qualified = true)
      ) ORDER BY t.tier_order)
        FROM public.duelo_season_tiers t WHERE t.season_id = s.id), '[]'::jsonb)
  ) INTO v_result FROM public.duelo_seasons s WHERE s.id = p_season_id;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.brand_get_drivers_available(
  p_brand_id uuid, p_season_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.duelo_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'driver_id', c.id, 'driver_name', c.name, 'cpf', c.cpf
  ) ORDER BY c.name) INTO v_result
    FROM public.customers c
   WHERE c.brand_id = p_brand_id
     AND '[MOTORISTA]' = ANY(COALESCE(c.tags,'{}'::text[]))
     AND NOT EXISTS (
       SELECT 1 FROM public.duelo_tier_memberships tm
        WHERE tm.season_id = p_season_id AND tm.driver_id = c.id);
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $$;

REVOKE ALL ON FUNCTION public.duelo_cancel_season(uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.duelo_pause_season(uuid) FROM public;
REVOKE ALL ON FUNCTION public.duelo_resume_season(uuid) FROM public;
REVOKE ALL ON FUNCTION public.duelo_update_prize(uuid,text,text,int) FROM public;
REVOKE ALL ON FUNCTION public.duelo_add_driver_to_season(uuid,uuid,uuid,int,text) FROM public;
REVOKE ALL ON FUNCTION public.brand_get_campeonato_dashboard(uuid) FROM public;
REVOKE ALL ON FUNCTION public.brand_get_seasons_list(uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.brand_get_series_detail(uuid,uuid) FROM public;
REVOKE ALL ON FUNCTION public.brand_get_brackets_full(uuid) FROM public;
REVOKE ALL ON FUNCTION public.brand_get_season_summary(uuid) FROM public;
REVOKE ALL ON FUNCTION public.brand_get_drivers_available(uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_cancel_season(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_pause_season(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_resume_season(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_update_prize(uuid,text,text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_add_driver_to_season(uuid,uuid,uuid,int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.brand_get_campeonato_dashboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.brand_get_seasons_list(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.brand_get_series_detail(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.brand_get_brackets_full(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.brand_get_season_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.brand_get_drivers_available(uuid,uuid) TO authenticated;