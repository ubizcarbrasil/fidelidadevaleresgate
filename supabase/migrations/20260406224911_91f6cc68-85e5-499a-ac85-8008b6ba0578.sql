
-- RPC: perfil competitivo de um motorista
CREATE OR REPLACE FUNCTION public.get_driver_competitive_profile(p_customer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participant_id uuid;
  v_total_duels bigint := 0;
  v_wins bigint := 0;
  v_losses bigint := 0;
  v_draws bigint := 0;
  v_win_rate numeric := 0;
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_points_won numeric := 0;
  v_points_lost numeric := 0;
  v_recent jsonb := '[]'::jsonb;
  v_rec RECORD;
  v_streak integer := 0;
  v_last_result text := '';
BEGIN
  -- Get participant id
  SELECT id INTO v_participant_id
  FROM driver_duel_participants
  WHERE customer_id = p_customer_id;

  IF v_participant_id IS NULL THEN
    RETURN jsonb_build_object(
      'total_duels', 0, 'wins', 0, 'losses', 0, 'draws', 0,
      'win_rate', 0, 'current_streak', 0, 'best_streak', 0,
      'points_won', 0, 'points_lost', 0, 'recent', '[]'::jsonb
    );
  END IF;

  -- Count stats
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE winner_id = v_participant_id),
    COUNT(*) FILTER (WHERE winner_id IS NOT NULL AND winner_id != v_participant_id),
    COUNT(*) FILTER (WHERE winner_id IS NULL)
  INTO v_total_duels, v_wins, v_losses, v_draws
  FROM driver_duels
  WHERE status = 'finished'
    AND (challenger_id = v_participant_id OR challenged_id = v_participant_id);

  IF v_total_duels > 0 THEN
    v_win_rate := ROUND((v_wins::numeric / v_total_duels) * 100, 1);
  END IF;

  -- Points won/lost from ledger
  SELECT COALESCE(SUM(points_amount), 0) INTO v_points_won
  FROM points_ledger
  WHERE customer_id = p_customer_id
    AND reference_type = 'DUEL_SETTLEMENT'
    AND entry_type = 'CREDIT';

  SELECT COALESCE(SUM(points_amount), 0) INTO v_points_lost
  FROM points_ledger
  WHERE customer_id = p_customer_id
    AND reference_type = 'DUEL_RESERVE'
    AND entry_type = 'DEBIT';

  -- Subtract refunds from points_lost (draws get refunded)
  v_points_lost := v_points_lost - LEAST(v_points_lost, v_points_won);
  -- Net points won is credits minus debits
  -- Actually let's keep it simpler: points_won = CREDIT from DUEL_SETTLEMENT, points_lost = DEBIT from DUEL_RESERVE minus CREDIT refunds
  -- Recalculate properly
  v_points_lost := (
    SELECT COALESCE(SUM(points_amount), 0)
    FROM points_ledger
    WHERE customer_id = p_customer_id
      AND reference_type = 'DUEL_RESERVE'
      AND entry_type = 'DEBIT'
  ) - v_points_won;
  IF v_points_lost < 0 THEN v_points_lost := 0; END IF;

  -- Streaks (ordered by finished_at)
  v_streak := 0;
  v_best_streak := 0;
  v_current_streak := 0;
  FOR v_rec IN
    SELECT
      CASE
        WHEN winner_id = v_participant_id THEN 'W'
        WHEN winner_id IS NULL THEN 'D'
        ELSE 'L'
      END AS result
    FROM driver_duels
    WHERE status = 'finished'
      AND (challenger_id = v_participant_id OR challenged_id = v_participant_id)
    ORDER BY finished_at ASC
  LOOP
    IF v_rec.result = 'W' THEN
      IF v_last_result = 'W' THEN
        v_streak := v_streak + 1;
      ELSE
        v_streak := 1;
      END IF;
      IF v_streak > v_best_streak THEN v_best_streak := v_streak; END IF;
    ELSE
      v_streak := 0;
    END IF;
    v_last_result := v_rec.result;
  END LOOP;

  -- Current streak (from most recent backwards)
  v_current_streak := 0;
  FOR v_rec IN
    SELECT
      CASE
        WHEN winner_id = v_participant_id THEN 'W'
        WHEN winner_id IS NULL THEN 'D'
        ELSE 'L'
      END AS result
    FROM driver_duels
    WHERE status = 'finished'
      AND (challenger_id = v_participant_id OR challenged_id = v_participant_id)
    ORDER BY finished_at DESC
  LOOP
    IF v_rec.result = 'W' AND (v_current_streak >= 0) THEN
      IF v_current_streak <= 0 AND v_current_streak != 0 THEN EXIT; END IF;
      v_current_streak := v_current_streak + 1;
    ELSIF v_rec.result = 'L' AND (v_current_streak <= 0) THEN
      IF v_current_streak > 0 THEN EXIT; END IF;
      v_current_streak := v_current_streak - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Recent 5 duels
  SELECT jsonb_agg(row_to_json(sub)) INTO v_recent
  FROM (
    SELECT
      d.id,
      d.finished_at,
      d.challenger_rides_count,
      d.challenged_rides_count,
      d.challenger_points_bet,
      d.challenged_points_bet,
      CASE
        WHEN d.winner_id = v_participant_id THEN 'win'
        WHEN d.winner_id IS NULL THEN 'draw'
        ELSE 'loss'
      END AS result,
      CASE
        WHEN d.challenger_id = v_participant_id THEN (SELECT c.name FROM driver_duel_participants p JOIN customers c ON c.id = p.customer_id WHERE p.id = d.challenged_id)
        ELSE (SELECT c.name FROM driver_duel_participants p JOIN customers c ON c.id = p.customer_id WHERE p.id = d.challenger_id)
      END AS opponent_name
    FROM driver_duels d
    WHERE d.status = 'finished'
      AND (d.challenger_id = v_participant_id OR d.challenged_id = v_participant_id)
    ORDER BY d.finished_at DESC
    LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'total_duels', v_total_duels,
    'wins', v_wins,
    'losses', v_losses,
    'draws', v_draws,
    'win_rate', v_win_rate,
    'current_streak', v_current_streak,
    'best_streak', v_best_streak,
    'points_won', v_points_won,
    'points_lost', v_points_lost,
    'recent', COALESCE(v_recent, '[]'::jsonb)
  );
END;
$$;
