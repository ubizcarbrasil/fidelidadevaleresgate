
-- 1. Tabela de auditoria
CREATE TABLE public.driver_duel_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid REFERENCES public.driver_duels(id) ON DELETE CASCADE NOT NULL,
  challenger_customer_id uuid NOT NULL,
  challenged_customer_id uuid NOT NULL,
  challenger_rides_counted bigint NOT NULL DEFAULT 0,
  challenged_rides_counted bigint NOT NULL DEFAULT 0,
  challenger_ride_ids uuid[] DEFAULT '{}',
  challenged_ride_ids uuid[] DEFAULT '{}',
  winner_participant_id uuid,
  count_window_start timestamptz NOT NULL,
  count_window_end timestamptz NOT NULL,
  points_settled boolean DEFAULT false,
  finalized_by text DEFAULT 'cron',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_duel_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read duel audit logs"
  ON public.driver_duel_audit_log FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'root_admin') OR
    public.has_role(auth.uid(), 'brand_admin') OR
    public.has_role(auth.uid(), 'branch_admin')
  );

CREATE INDEX idx_duel_audit_log_duel_id ON public.driver_duel_audit_log(duel_id);

-- 2. Função auxiliar para coletar IDs das corridas
CREATE OR REPLACE FUNCTION public.collect_duel_ride_ids(
  p_customer_id uuid,
  p_branch_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(id ORDER BY finalized_at), '{}')
  FROM machine_rides
  WHERE driver_customer_id = p_customer_id
    AND branch_id = p_branch_id
    AND ride_status = 'FINALIZED'
    AND finalized_at >= p_start_at
    AND finalized_at <= p_end_at;
$$;

-- 3. Atualizar finalize_duel para gravar auditoria
CREATE OR REPLACE FUNCTION public.finalize_duel(p_duel_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenger_count bigint;
  v_challenged_count bigint;
  v_challenger_rides uuid[];
  v_challenged_rides uuid[];
  v_winner uuid;
  v_total_bet integer;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não pode ser finalizado');
  END IF;

  SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  -- Count rides
  v_challenger_count := count_duel_rides(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_count := count_duel_rides(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  -- Collect ride IDs for audit
  v_challenger_rides := collect_duel_ride_ids(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_rides := collect_duel_ride_ids(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  -- Determine winner
  IF v_challenger_count > v_challenged_count THEN
    v_winner := v_duel.challenger_id;
  ELSIF v_challenged_count > v_challenger_count THEN
    v_winner := v_duel.challenged_id;
  ELSE
    v_winner := NULL;
  END IF;

  -- Insert audit log BEFORE settling points
  INSERT INTO driver_duel_audit_log (
    duel_id, challenger_customer_id, challenged_customer_id,
    challenger_rides_counted, challenged_rides_counted,
    challenger_ride_ids, challenged_ride_ids,
    winner_participant_id,
    count_window_start, count_window_end,
    points_settled
  ) VALUES (
    p_duel_id, v_challenger_customer_id, v_challenged_customer_id,
    v_challenger_count, v_challenged_count,
    v_challenger_rides, v_challenged_rides,
    v_winner,
    v_duel.start_at, v_duel.end_at,
    v_duel.points_reserved
  );

  -- Settle points if reserved
  IF v_duel.points_reserved AND NOT v_duel.points_settled THEN
    v_total_bet := v_duel.challenger_points_bet + v_duel.challenged_points_bet;

    IF v_winner IS NOT NULL THEN
      IF v_winner = v_duel.challenger_id THEN
        UPDATE customers SET points_balance = points_balance + v_total_bet WHERE id = v_challenger_customer_id;
        INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
        VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_total_bet, 'Vitória no Duelo - Prêmio', 'DUEL_SETTLEMENT', v_duel.id, NULL);
      ELSE
        UPDATE customers SET points_balance = points_balance + v_total_bet WHERE id = v_challenged_customer_id;
        INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
        VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_total_bet, 'Vitória no Duelo - Prêmio', 'DUEL_SETTLEMENT', v_duel.id, NULL);
      END IF;
    ELSE
      UPDATE customers SET points_balance = points_balance + v_duel.challenger_points_bet WHERE id = v_challenger_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
      VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_duel.challenger_points_bet, 'Empate no Duelo - Devolução', 'DUEL_SETTLEMENT', v_duel.id, NULL);

      UPDATE customers SET points_balance = points_balance + v_duel.challenged_points_bet WHERE id = v_challenged_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
      VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_duel.challenged_points_bet, 'Empate no Duelo - Devolução', 'DUEL_SETTLEMENT', v_duel.id, NULL);
    END IF;
  END IF;

  UPDATE driver_duels
  SET status = 'finished',
      challenger_rides_count = v_challenger_count,
      challenged_rides_count = v_challenged_count,
      winner_id = v_winner,
      finished_at = now(),
      points_settled = CASE WHEN points_reserved THEN true ELSE points_settled END
  WHERE id = p_duel_id;

  RETURN jsonb_build_object(
    'success', true,
    'challenger_rides', v_challenger_count,
    'challenged_rides', v_challenged_count,
    'winner_id', v_winner,
    'points_settled', v_duel.points_reserved
  );
END;
$function$;
