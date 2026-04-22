-- ============================================================
-- C.5 COMMIT 2 — Notificações in-app
-- ============================================================

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.duelo_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'season_created','knockout_started','match_result','prize_received'
  )),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duelo_notif_driver_unread
  ON public.duelo_notifications(driver_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_duelo_notif_driver_created
  ON public.duelo_notifications(driver_id, created_at DESC);

ALTER TABLE public.duelo_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: leitura via RPC (SECURITY DEFINER) é o caminho oficial; aqui mantemos
-- política mínima para admins e service_role; INSERT só via funções DEFINER.
DROP POLICY IF EXISTS "duelo_notif_admin_read" ON public.duelo_notifications;
CREATE POLICY "duelo_notif_admin_read"
  ON public.duelo_notifications FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'root_admin'::app_role)
    OR (brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
        AND public.has_role(auth.uid(), 'brand_admin'::app_role))
  );

DROP POLICY IF EXISTS "duelo_notif_service_all" ON public.duelo_notifications;
CREATE POLICY "duelo_notif_service_all"
  ON public.duelo_notifications FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2) RPCs de leitura/escrita do motorista

CREATE OR REPLACE FUNCTION public.driver_get_notifications(
  p_brand_id uuid,
  p_driver_id uuid,
  p_only_unread boolean DEFAULT false,
  p_limit int DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Valida pertencimento do motorista à marca
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
     WHERE id = p_driver_id AND brand_id = p_brand_id
  ) THEN
    RAISE EXCEPTION 'Motorista não pertence à marca';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t.created_at) DESC), '[]'::jsonb)
    INTO v_result
  FROM (
    SELECT id, driver_id, brand_id, season_id, event_type,
           title, message, action_url, read_at, created_at
      FROM public.duelo_notifications
     WHERE driver_id = p_driver_id
       AND brand_id = p_brand_id
       AND (NOT p_only_unread OR read_at IS NULL)
     ORDER BY created_at DESC
     LIMIT p_limit
  ) t;

  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.driver_get_notifications(uuid,uuid,boolean,int) FROM public;
GRANT EXECUTE ON FUNCTION public.driver_get_notifications(uuid,uuid,boolean,int)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.driver_mark_notification_read(
  p_notification_id uuid,
  p_driver_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.duelo_notifications
     SET read_at = now()
   WHERE id = p_notification_id
     AND driver_id = p_driver_id
     AND read_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.driver_mark_notification_read(uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.driver_mark_notification_read(uuid,uuid)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.driver_mark_all_read(
  p_brand_id uuid,
  p_driver_id uuid
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.duelo_notifications
     SET read_at = now()
   WHERE driver_id = p_driver_id
     AND brand_id = p_brand_id
     AND read_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;
REVOKE ALL ON FUNCTION public.driver_mark_all_read(uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.driver_mark_all_read(uuid,uuid)
  TO anon, authenticated, service_role;

-- 3) Trigger season_created (em duelo_tier_memberships)

CREATE OR REPLACE FUNCTION public.duelo_notify_season_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season record;
  v_tier_name text;
BEGIN
  IF NEW.source NOT IN ('seed','manual_add') THEN
    RETURN NEW;
  END IF;

  SELECT s.*, t.name AS tier_name
    INTO v_season
    FROM public.duelo_seasons s
    JOIN public.duelo_season_tiers t ON t.id = NEW.tier_id
   WHERE s.id = NEW.season_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  INSERT INTO public.duelo_notifications
    (driver_id, brand_id, season_id, event_type, title, message, action_url)
  VALUES (
    NEW.driver_id,
    v_season.brand_id,
    v_season.id,
    'season_created',
    'Nova temporada do Campeonato',
    'Você foi alocado na ' || COALESCE(v_season.tier_name, 'série') || '. Boa sorte!',
    '/driver?campeonato=1'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_duelo_notif_season_created ON public.duelo_tier_memberships;
CREATE TRIGGER trg_duelo_notif_season_created
AFTER INSERT ON public.duelo_tier_memberships
FOR EACH ROW EXECUTE FUNCTION public.duelo_notify_season_created();

-- 4) duelo_advance_phases — restauração completa + hooks de notificação
--    Mantém TODA a lógica da versão restaurada em 20260422020043 e adiciona:
--    - knockout_started: quando phase = classification → knockout_*
--    - match_result: ao definir winner_id em cada bracket
--    - hook de prêmios (preservado)

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
  v_round_total int; v_round_done int; v_b record; v_winner uuid; v_loser uuid; v_next_round text;
  v_pair record; v_slot int; v_champion uuid; v_runner_up uuid;
  v_semis uuid[]; v_qf uuid[]; v_r16 uuid[];
  v_prize_season record;
  v_qualified record;
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

          -- HOOK NOTIFICAÇÕES C.5: knockout_started — notifica todos qualificados
          BEGIN
            FOR v_qualified IN
              SELECT DISTINCT b2.driver_a_id AS driver_id
                FROM public.duelo_brackets b2
               WHERE b2.season_id = v_season.id
                 AND b2.driver_a_id IS NOT NULL
              UNION
              SELECT DISTINCT b2.driver_b_id
                FROM public.duelo_brackets b2
               WHERE b2.season_id = v_season.id
                 AND b2.driver_b_id IS NOT NULL
            LOOP
              INSERT INTO public.duelo_notifications
                (driver_id, brand_id, season_id, event_type, title, message, action_url)
              VALUES (
                v_qualified.driver_id, v_season.brand_id, v_season.id,
                'knockout_started',
                'Mata-mata começou!',
                'Você se classificou para o mata-mata. Veja seu confronto!',
                '/driver?campeonato=1'
              );
            END LOOP;
          EXCEPTION WHEN OTHERS THEN NULL; END;

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
          IF v_b.driver_a_id IS NULL THEN v_winner := v_b.driver_b_id; v_loser := NULL;
          ELSIF v_b.driver_b_id IS NULL THEN v_winner := v_b.driver_a_id; v_loser := NULL;
          ELSIF v_b.driver_a_rides > v_b.driver_b_rides THEN v_winner := v_b.driver_a_id; v_loser := v_b.driver_b_id;
          ELSIF v_b.driver_b_rides > v_b.driver_a_rides THEN v_winner := v_b.driver_b_id; v_loser := v_b.driver_a_id;
          ELSE
            SELECT driver_id INTO v_winner FROM public.duelo_season_standings
             WHERE season_id = v_season.id AND driver_id IN (v_b.driver_a_id, v_b.driver_b_id)
             ORDER BY position_in_tier ASC NULLS LAST, points DESC, last_ride_at ASC LIMIT 1;
            v_loser := CASE WHEN v_winner = v_b.driver_a_id THEN v_b.driver_b_id ELSE v_b.driver_a_id END;
          END IF;
          UPDATE public.duelo_brackets SET winner_id = v_winner WHERE id = v_b.id;

          -- HOOK NOTIFICAÇÕES C.5: match_result
          BEGIN
            IF v_winner IS NOT NULL THEN
              INSERT INTO public.duelo_notifications
                (driver_id, brand_id, season_id, event_type, title, message, action_url)
              VALUES (v_winner, v_season.brand_id, v_season.id, 'match_result',
                      'Você venceu o confronto! 🏆',
                      'Avançou para a próxima fase do mata-mata.',
                      '/driver?campeonato=1');
            END IF;
            IF v_loser IS NOT NULL THEN
              INSERT INTO public.duelo_notifications
                (driver_id, brand_id, season_id, event_type, title, message, action_url)
              VALUES (v_loser, v_season.brand_id, v_season.id, 'match_result',
                      'Confronto encerrado',
                      'Você foi eliminado nesta fase. Obrigado por participar!',
                      '/driver?campeonato=1');
            END IF;
          EXCEPTION WHEN OTHERS THEN NULL; END;
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

  -- Hook C.5 (preservado): cálculo de prêmios para seasons recém-finalizadas
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

-- 5) Hook em duelo_confirm_prize_distribution: notificar 'prize_received'

CREATE OR REPLACE FUNCTION public.duelo_confirm_prize_distribution(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season record;
  v_dist record;
  v_total_drivers int := 0;
  v_total_points int := 0;
  v_ledger_id uuid;
BEGIN
  SELECT * INTO v_season FROM duelo_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;

  IF NOT (
    has_role(auth.uid(), 'root_admin'::app_role)
    OR (v_season.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(), 'brand_admin'::app_role))
    OR (v_season.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(), 'branch_admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar prêmios desta temporada';
  END IF;

  FOR v_dist IN
    SELECT * FROM duelo_prize_distributions
    WHERE season_id = p_season_id AND status = 'pending'
    FOR UPDATE
  LOOP
    INSERT INTO points_ledger
      (brand_id, branch_id, customer_id, entry_type, points_amount, money_amount,
       reason, reference_type, reference_id, created_by_user_id)
    VALUES
      (v_dist.brand_id, v_dist.branch_id, v_dist.driver_id, 'CREDIT'::ledger_entry_type,
       v_dist.points_awarded, 0,
       'Prêmio Campeonato — ' || v_dist.tier_name || ' / ' || v_dist.position,
       'CAMPEONATO_PRIZE'::ledger_reference_type, v_dist.id, auth.uid())
    RETURNING id INTO v_ledger_id;

    UPDATE customers
       SET points_balance = points_balance + v_dist.points_awarded
     WHERE id = v_dist.driver_id;

    UPDATE duelo_prize_distributions
       SET status = 'confirmed',
           confirmed_by = auth.uid(),
           confirmed_at = now(),
           points_ledger_id = v_ledger_id
     WHERE id = v_dist.id;

    -- HOOK C.5: notificação prize_received
    BEGIN
      INSERT INTO public.duelo_notifications
        (driver_id, brand_id, season_id, event_type, title, message, action_url)
      VALUES (
        v_dist.driver_id, v_dist.brand_id, p_season_id, 'prize_received',
        'Você recebeu um prêmio! 🎁',
        'Recebeu ' || v_dist.points_awarded || ' pontos pelo Campeonato (' ||
          v_dist.tier_name || ' / ' || v_dist.position || ').',
        '/driver?campeonato=1'
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    v_total_drivers := v_total_drivers + 1;
    v_total_points := v_total_points + v_dist.points_awarded;
  END LOOP;

  UPDATE duelo_champions SET prizes_distributed = true WHERE season_id = p_season_id;

  INSERT INTO duelo_attempts_log (code, season_id, brand_id, branch_id, details_json)
  VALUES ('prize_distributed', p_season_id, v_season.brand_id, v_season.branch_id,
          jsonb_build_object('total_drivers', v_total_drivers, 'total_points', v_total_points,
                             'confirmed_by', auth.uid()));

  RETURN jsonb_build_object(
    'total_drivers', v_total_drivers,
    'total_points', v_total_points,
    'confirmed_at', now()
  );
END;
$$;

-- ============================================================
-- ROLLBACK (NÃO RECOMENDADO)
-- ============================================================
-- DROP TRIGGER IF EXISTS trg_duelo_notif_season_created ON public.duelo_tier_memberships;
-- DROP FUNCTION IF EXISTS public.duelo_notify_season_created() CASCADE;
-- DROP FUNCTION IF EXISTS public.driver_mark_all_read(uuid,uuid);
-- DROP FUNCTION IF EXISTS public.driver_mark_notification_read(uuid,uuid);
-- DROP FUNCTION IF EXISTS public.driver_get_notifications(uuid,uuid,boolean,int);
-- DROP TABLE IF EXISTS public.duelo_notifications;
-- Restaurar duelo_advance_phases e duelo_confirm_prize_distribution às versões da migration 20260422020043.