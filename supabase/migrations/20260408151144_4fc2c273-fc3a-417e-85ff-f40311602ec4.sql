
-- 1. Create duel_side_bets table
CREATE TABLE public.duel_side_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid NOT NULL REFERENCES driver_duels(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id),
  brand_id uuid NOT NULL REFERENCES brands(id),

  -- Bettor A (creator)
  bettor_a_customer_id uuid NOT NULL REFERENCES customers(id),
  bettor_a_predicted_winner uuid NOT NULL REFERENCES driver_duel_participants(id),
  bettor_a_points integer NOT NULL,

  -- Bettor B (acceptor)
  bettor_b_customer_id uuid REFERENCES customers(id),
  bettor_b_predicted_winner uuid REFERENCES driver_duel_participants(id),
  bettor_b_points integer,

  -- Negotiation
  status text NOT NULL DEFAULT 'open',
  counter_proposal_points integer,

  -- Escrow
  points_reserved boolean NOT NULL DEFAULT false,

  -- Settlement
  winner_customer_id uuid REFERENCES customers(id),
  duel_winner_bonus integer DEFAULT 0,
  settled_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.duel_side_bets ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read side bets
CREATE POLICY "Anyone can view side bets"
ON public.duel_side_bets FOR SELECT
USING (true);

-- RLS: no direct inserts/updates (all via RPCs with SECURITY DEFINER)
-- No INSERT/UPDATE/DELETE policies needed since RPCs bypass RLS

-- Indexes
CREATE INDEX idx_duel_side_bets_duel_id ON public.duel_side_bets(duel_id);
CREATE INDEX idx_duel_side_bets_status ON public.duel_side_bets(status);
CREATE INDEX idx_duel_side_bets_bettor_a ON public.duel_side_bets(bettor_a_customer_id);
CREATE INDEX idx_duel_side_bets_bettor_b ON public.duel_side_bets(bettor_b_customer_id);

-- Trigger for updated_at
CREATE TRIGGER update_duel_side_bets_updated_at
BEFORE UPDATE ON public.duel_side_bets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validate status
CREATE OR REPLACE FUNCTION public.validate_side_bet_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('open','counter_proposed','matched','settled','canceled') THEN
    RAISE EXCEPTION 'status must be open, counter_proposed, matched, settled, or canceled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_side_bet_status
BEFORE INSERT OR UPDATE ON public.duel_side_bets
FOR EACH ROW
EXECUTE FUNCTION public.validate_side_bet_status();

-- 2. RPC: create_side_bet
CREATE OR REPLACE FUNCTION public.create_side_bet(
  p_duel_id uuid,
  p_customer_id uuid,
  p_predicted_winner_participant_id uuid,
  p_points integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_balance numeric;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
BEGIN
  -- Validate points
  IF p_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor da aposta deve ser positivo');
  END IF;

  -- Get duel
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não está ativo');
  END IF;

  -- Validate predicted winner is a participant of this duel
  IF p_predicted_winner_participant_id != v_duel.challenger_id AND p_predicted_winner_participant_id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante previsto não pertence a este duelo');
  END IF;

  -- Prevent duel participants from betting on own duel
  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  IF p_customer_id = v_challenger_cid OR p_customer_id = v_challenged_cid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participantes do duelo não podem apostar no próprio duelo');
  END IF;

  -- Validate balance
  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id;
  IF v_balance IS NULL OR v_balance < p_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente', 'balance', COALESCE(v_balance, 0));
  END IF;

  -- Create open bet (no escrow yet - only when matched)
  INSERT INTO duel_side_bets (duel_id, branch_id, brand_id, bettor_a_customer_id, bettor_a_predicted_winner, bettor_a_points, status)
  VALUES (p_duel_id, v_duel.branch_id, v_duel.brand_id, p_customer_id, p_predicted_winner_participant_id, p_points, 'open');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. RPC: accept_side_bet
CREATE OR REPLACE FUNCTION public.accept_side_bet(
  p_bet_id uuid,
  p_customer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_balance_b numeric;
  v_balance_a numeric;
  v_opposite_winner uuid;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
BEGIN
  SELECT * INTO v_bet FROM duel_side_bets WHERE id = p_bet_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aposta não encontrada ou não está aberta');
  END IF;

  -- Can't accept own bet
  IF v_bet.bettor_a_customer_id = p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode aceitar sua própria aposta');
  END IF;

  -- Get duel and validate it's still active
  SELECT * INTO v_duel FROM driver_duels WHERE id = v_bet.duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está mais ativo');
  END IF;

  -- Prevent duel participants
  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;
  IF p_customer_id = v_challenger_cid OR p_customer_id = v_challenged_cid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participantes do duelo não podem apostar');
  END IF;

  -- Determine opposite winner
  IF v_bet.bettor_a_predicted_winner = v_duel.challenger_id THEN
    v_opposite_winner := v_duel.challenged_id;
  ELSE
    v_opposite_winner := v_duel.challenger_id;
  END IF;

  -- Validate balances
  SELECT points_balance INTO v_balance_b FROM customers WHERE id = p_customer_id;
  IF v_balance_b IS NULL OR v_balance_b < v_bet.bettor_a_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  SELECT points_balance INTO v_balance_a FROM customers WHERE id = v_bet.bettor_a_customer_id;
  IF v_balance_a IS NULL OR v_balance_a < v_bet.bettor_a_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo do criador da aposta insuficiente');
  END IF;

  -- Escrow: debit both
  UPDATE customers SET points_balance = points_balance - v_bet.bettor_a_points WHERE id = v_bet.bettor_a_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (v_bet.bettor_a_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_bet.bettor_a_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  UPDATE customers SET points_balance = points_balance - v_bet.bettor_a_points WHERE id = p_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (p_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_bet.bettor_a_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  -- Update bet
  UPDATE duel_side_bets SET
    bettor_b_customer_id = p_customer_id,
    bettor_b_predicted_winner = v_opposite_winner,
    bettor_b_points = v_bet.bettor_a_points,
    status = 'matched',
    points_reserved = true
  WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. RPC: counter_propose_side_bet
CREATE OR REPLACE FUNCTION public.counter_propose_side_bet(
  p_bet_id uuid,
  p_customer_id uuid,
  p_counter_points integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_balance numeric;
  v_opposite_winner uuid;
  v_challenger_cid uuid;
  v_challenged_cid uuid;
BEGIN
  IF p_counter_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor deve ser positivo');
  END IF;

  SELECT * INTO v_bet FROM duel_side_bets WHERE id = p_bet_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aposta não encontrada ou não está aberta');
  END IF;

  IF v_bet.bettor_a_customer_id = p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode contrapropor sua própria aposta');
  END IF;

  SELECT * INTO v_duel FROM driver_duels WHERE id = v_bet.duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está mais ativo');
  END IF;

  -- Prevent duel participants
  SELECT customer_id INTO v_challenger_cid FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_cid FROM driver_duel_participants WHERE id = v_duel.challenged_id;
  IF p_customer_id = v_challenger_cid OR p_customer_id = v_challenged_cid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participantes do duelo não podem apostar');
  END IF;

  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id;
  IF v_balance IS NULL OR v_balance < p_counter_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  IF v_bet.bettor_a_predicted_winner = v_duel.challenger_id THEN
    v_opposite_winner := v_duel.challenged_id;
  ELSE
    v_opposite_winner := v_duel.challenger_id;
  END IF;

  UPDATE duel_side_bets SET
    bettor_b_customer_id = p_customer_id,
    bettor_b_predicted_winner = v_opposite_winner,
    counter_proposal_points = p_counter_points,
    status = 'counter_proposed'
  WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. RPC: respond_side_bet_counter
CREATE OR REPLACE FUNCTION public.respond_side_bet_counter(
  p_bet_id uuid,
  p_customer_id uuid,
  p_accept boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_agreed_points integer;
  v_balance_a numeric;
  v_balance_b numeric;
BEGIN
  SELECT * INTO v_bet FROM duel_side_bets WHERE id = p_bet_id AND status = 'counter_proposed' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aposta não encontrada ou sem contraproposta');
  END IF;

  -- Only bettor A (creator) can respond to counter
  IF v_bet.bettor_a_customer_id != p_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o criador da aposta pode responder');
  END IF;

  IF NOT p_accept THEN
    -- Reject: reopen bet
    UPDATE duel_side_bets SET
      bettor_b_customer_id = NULL,
      bettor_b_predicted_winner = NULL,
      counter_proposal_points = NULL,
      status = 'open'
    WHERE id = p_bet_id;
    RETURN jsonb_build_object('success', true, 'action', 'rejected');
  END IF;

  -- Accept counter: use counter_proposal_points as agreed value
  v_agreed_points := v_bet.counter_proposal_points;

  SELECT * INTO v_duel FROM driver_duels WHERE id = v_bet.duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está mais ativo');
  END IF;

  -- Validate balances
  SELECT points_balance INTO v_balance_a FROM customers WHERE id = v_bet.bettor_a_customer_id;
  IF v_balance_a IS NULL OR v_balance_a < v_agreed_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo do criador insuficiente');
  END IF;

  SELECT points_balance INTO v_balance_b FROM customers WHERE id = v_bet.bettor_b_customer_id;
  IF v_balance_b IS NULL OR v_balance_b < v_agreed_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo do aceitante insuficiente');
  END IF;

  -- Escrow both
  UPDATE customers SET points_balance = points_balance - v_agreed_points WHERE id = v_bet.bettor_a_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (v_bet.bettor_a_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_agreed_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  UPDATE customers SET points_balance = points_balance - v_agreed_points WHERE id = v_bet.bettor_b_customer_id;
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
  VALUES (v_bet.bettor_b_customer_id, v_bet.brand_id, v_bet.branch_id, 'DEBIT', v_agreed_points, 'Aposta no Duelo - Reserva', 'SIDE_BET_RESERVE', v_bet.id);

  UPDATE duel_side_bets SET
    bettor_a_points = v_agreed_points,
    bettor_b_points = v_agreed_points,
    status = 'matched',
    points_reserved = true
  WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true, 'action', 'accepted', 'agreed_points', v_agreed_points);
END;
$$;

-- 6. RPC: settle_side_bets (called by finalize_duel)
CREATE OR REPLACE FUNCTION public.settle_side_bets(p_duel_id uuid, p_winner_participant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet duel_side_bets%ROWTYPE;
  v_duel driver_duels%ROWTYPE;
  v_total_pot integer;
  v_winner_prize integer;
  v_duel_bonus integer;
  v_bet_winner_cid uuid;
  v_duel_winner_cid uuid;
  v_settled_count integer := 0;
  v_total_duel_bonus integer := 0;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado');
  END IF;

  -- Get duel winner customer_id (for bonus)
  IF p_winner_participant_id IS NOT NULL THEN
    SELECT customer_id INTO v_duel_winner_cid FROM driver_duel_participants WHERE id = p_winner_participant_id;
  END IF;

  FOR v_bet IN SELECT * FROM duel_side_bets WHERE duel_id = p_duel_id AND status = 'matched' AND points_reserved = true FOR UPDATE
  LOOP
    v_total_pot := v_bet.bettor_a_points + v_bet.bettor_b_points;

    IF p_winner_participant_id IS NULL THEN
      -- Draw: refund both
      UPDATE customers SET points_balance = points_balance + v_bet.bettor_a_points WHERE id = v_bet.bettor_a_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
      VALUES (v_bet.bettor_a_customer_id, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_bet.bettor_a_points, 'Empate no Duelo - Devolução da Aposta', 'SIDE_BET_REFUND', v_bet.id);

      UPDATE customers SET points_balance = points_balance + v_bet.bettor_b_points WHERE id = v_bet.bettor_b_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
      VALUES (v_bet.bettor_b_customer_id, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_bet.bettor_b_points, 'Empate no Duelo - Devolução da Aposta', 'SIDE_BET_REFUND', v_bet.id);

      UPDATE duel_side_bets SET status = 'settled', settled_at = now(), duel_winner_bonus = 0 WHERE id = v_bet.id;
    ELSE
      -- Determine bet winner
      IF v_bet.bettor_a_predicted_winner = p_winner_participant_id THEN
        v_bet_winner_cid := v_bet.bettor_a_customer_id;
      ELSE
        v_bet_winner_cid := v_bet.bettor_b_customer_id;
      END IF;

      -- Calculate 90/10 split
      v_duel_bonus := FLOOR(v_total_pot * 0.10);
      v_winner_prize := v_total_pot - v_duel_bonus;

      -- Credit bet winner (90%)
      UPDATE customers SET points_balance = points_balance + v_winner_prize WHERE id = v_bet_winner_cid;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
      VALUES (v_bet_winner_cid, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_winner_prize, 'Aposta no Duelo - Vitória', 'SIDE_BET_WIN', v_bet.id);

      -- Credit duel winner (10% bonus)
      IF v_duel_winner_cid IS NOT NULL AND v_duel_bonus > 0 THEN
        UPDATE customers SET points_balance = points_balance + v_duel_bonus WHERE id = v_duel_winner_cid;
        INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id)
        VALUES (v_duel_winner_cid, v_bet.brand_id, v_bet.branch_id, 'CREDIT', v_duel_bonus, 'Bônus 10% - Apostas no seu duelo', 'SIDE_BET_DUEL_BONUS', v_bet.id);
        v_total_duel_bonus := v_total_duel_bonus + v_duel_bonus;
      END IF;

      UPDATE duel_side_bets SET
        status = 'settled',
        winner_customer_id = v_bet_winner_cid,
        duel_winner_bonus = v_duel_bonus,
        settled_at = now()
      WHERE id = v_bet.id;
    END IF;

    v_settled_count := v_settled_count + 1;
  END LOOP;

  -- Cancel any open/counter_proposed bets
  UPDATE duel_side_bets SET status = 'canceled' WHERE duel_id = p_duel_id AND status IN ('open','counter_proposed');

  RETURN jsonb_build_object('success', true, 'settled', v_settled_count, 'duel_winner_bonus_total', v_total_duel_bonus);
END;
$$;

-- 7. Update finalize_duel to call settle_side_bets
CREATE OR REPLACE FUNCTION public.finalize_duel(p_duel_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  v_side_bet_result jsonb;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não pode ser finalizado');
  END IF;

  SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  v_challenger_count := count_duel_rides(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_count := count_duel_rides(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  v_challenger_rides := collect_duel_ride_ids(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_rides := collect_duel_ride_ids(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  IF v_challenger_count > v_challenged_count THEN
    v_winner := v_duel.challenger_id;
  ELSIF v_challenged_count > v_challenger_count THEN
    v_winner := v_duel.challenged_id;
  ELSE
    v_winner := NULL;
  END IF;

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

  -- Settle side bets
  v_side_bet_result := settle_side_bets(p_duel_id, v_winner);

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
    'points_settled', v_duel.points_reserved,
    'side_bets', v_side_bet_result
  );
END;
$$;
