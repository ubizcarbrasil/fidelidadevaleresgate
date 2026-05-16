-- C.5 FIX: Restaurar duelo_advance_phases à versão canônica da C.4 + adicionar hook de cálculo de prêmios.
-- Drop do no-op duelo_advance_single_season criado erroneamente em 20260422014402.

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
  v_prize_season record;
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

  -- Hook C.5: calcular prêmios para seasons recém-finalizadas sem distribuições
  FOR v_prize_season IN
    SELECT s.* FROM public.duelo_seasons s
     WHERE s.phase = 'finished'
       AND NOT EXISTS (
         SELECT 1 FROM public.duelo_prize_distributions d WHERE d.season_id = s.id
       )
  LOOP
    BEGIN
      PERFORM public.duelo_calculate_prizes(v_prize_season.id);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
      VALUES ('prize_calc_error', v_prize_season.id, v_prize_season.brand_id, v_prize_season.branch_id,
              jsonb_build_object('sqlstate', SQLSTATE, 'message', SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object('processed', v_summary);
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_advance_phases() FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_advance_phases() TO authenticated, service_role;

-- Drop do no-op desnecessário
DROP FUNCTION IF EXISTS public.duelo_advance_single_season(uuid);

-- ROLLBACK: re-aplicar bloco do CREATE OR REPLACE da migration 20260422014402 (NÃO RECOMENDADO — quebra o motor)