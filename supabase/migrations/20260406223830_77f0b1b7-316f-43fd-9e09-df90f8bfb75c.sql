
-- 1. Adicionar colunas de aposta/negociação
ALTER TABLE driver_duels
  ADD COLUMN IF NOT EXISTS challenger_points_bet integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS challenged_points_bet integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS negotiation_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS counter_proposal_points integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS counter_proposal_by text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS points_reserved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points_settled boolean NOT NULL DEFAULT false;

-- 2. Trigger de validação do negotiation_status
CREATE OR REPLACE FUNCTION public.validate_duel_negotiation_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF NEW.negotiation_status NOT IN ('none','proposed','counter_proposed','agreed','rejected') THEN
    RAISE EXCEPTION 'negotiation_status must be none, proposed, counter_proposed, agreed, or rejected';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_duel_negotiation ON driver_duels;
CREATE TRIGGER validate_duel_negotiation
  BEFORE INSERT OR UPDATE ON driver_duels
  FOR EACH ROW
  EXECUTE FUNCTION validate_duel_negotiation_status();

-- 3. Recriar create_duel_challenge com suporte a pontos
CREATE OR REPLACE FUNCTION public.create_duel_challenge(
  p_challenger_customer_id uuid,
  p_challenged_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_points_bet integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
  v_balance numeric;
BEGIN
  -- Validate challenger
  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não está habilitado para duelos');
  END IF;

  -- Validate challenged
  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Adversário não está habilitado para duelos');
  END IF;

  IF p_challenger_customer_id = p_challenged_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você não pode desafiar a si mesmo');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à data de fim');
  END IF;

  -- Validate balance if betting points
  IF p_points_bet > 0 THEN
    SELECT points_balance INTO v_balance FROM customers WHERE id = p_challenger_customer_id;
    IF v_balance IS NULL OR v_balance < p_points_bet THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente para a aposta', 'balance', COALESCE(v_balance, 0));
    END IF;
  END IF;

  INSERT INTO driver_duels (
    branch_id, brand_id, challenger_id, challenged_id, start_at, end_at, status,
    challenger_points_bet, negotiation_status
  )
  VALUES (
    p_branch_id, p_brand_id, v_challenger.id, v_challenged.id, p_start_at, p_end_at, 'pending',
    p_points_bet, CASE WHEN p_points_bet > 0 THEN 'proposed' ELSE 'none' END
  )
  RETURNING id INTO v_duel_id;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$function$;

-- 4. Recriar respond_to_duel com reserva de pontos
CREATE OR REPLACE FUNCTION public.respond_to_duel(p_duel_id uuid, p_customer_id uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenged_balance numeric;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou já respondido');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND OR v_participant.id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiado pode responder');
  END IF;

  IF p_accept THEN
    -- If there are points involved, reserve them
    IF v_duel.challenger_points_bet > 0 AND v_duel.negotiation_status = 'proposed' THEN
      -- Validate challenged balance
      SELECT points_balance INTO v_challenged_balance FROM customers WHERE id = p_customer_id;
      IF v_challenged_balance IS NULL OR v_challenged_balance < v_duel.challenger_points_bet THEN
        RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente para aceitar a aposta', 'balance', COALESCE(v_challenged_balance, 0));
      END IF;

      -- Get customer IDs
      SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
      v_challenged_customer_id := p_customer_id;

      -- Debit challenger
      UPDATE customers SET points_balance = points_balance - v_duel.challenger_points_bet WHERE id = v_challenger_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
      VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_duel.challenger_points_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

      -- Debit challenged
      UPDATE customers SET points_balance = points_balance - v_duel.challenger_points_bet WHERE id = v_challenged_customer_id;
      INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
      VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_duel.challenger_points_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

      -- Update duel
      UPDATE driver_duels SET
        status = 'accepted', accepted_at = now(),
        challenged_points_bet = challenger_points_bet,
        negotiation_status = 'agreed',
        points_reserved = true
      WHERE id = p_duel_id;
    ELSE
      UPDATE driver_duels SET status = 'accepted', accepted_at = now() WHERE id = p_duel_id;
    END IF;
  ELSE
    UPDATE driver_duels SET status = 'declined', declined_at = now() WHERE id = p_duel_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_status', CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END);
END;
$function$;

-- 5. Nova RPC: counter_propose_duel
CREATE OR REPLACE FUNCTION public.counter_propose_duel(
  p_duel_id uuid,
  p_customer_id uuid,
  p_counter_points integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
  v_balance numeric;
  v_role text; -- 'challenger' or 'challenged'
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou já respondido');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante não encontrado');
  END IF;

  -- Determine role
  IF v_participant.id = v_duel.challenged_id THEN
    v_role := 'challenged';
  ELSIF v_participant.id = v_duel.challenger_id THEN
    v_role := 'challenger';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Você não participa deste duelo');
  END IF;

  IF p_counter_points <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor da contraproposta deve ser maior que zero');
  END IF;

  -- Validate balance
  SELECT points_balance INTO v_balance FROM customers WHERE id = p_customer_id;
  IF v_balance IS NULL OR v_balance < p_counter_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente para a contraproposta', 'balance', COALESCE(v_balance, 0));
  END IF;

  UPDATE driver_duels SET
    counter_proposal_points = p_counter_points,
    counter_proposal_by = v_role,
    negotiation_status = 'counter_proposed'
  WHERE id = p_duel_id;

  RETURN jsonb_build_object('success', true, 'counter_points', p_counter_points, 'proposed_by', v_role);
END;
$function$;

-- 6. Nova RPC: respond_counter_proposal
CREATE OR REPLACE FUNCTION public.respond_counter_proposal(
  p_duel_id uuid,
  p_customer_id uuid,
  p_accept boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_participant driver_duel_participants%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenger_balance numeric;
  v_challenged_balance numeric;
  v_bet integer;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status = 'pending' AND negotiation_status = 'counter_proposed';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou sem contraproposta pendente');
  END IF;

  SELECT * INTO v_participant FROM driver_duel_participants WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante não encontrado');
  END IF;

  -- The responder must be the OTHER person (not the one who proposed)
  IF v_duel.counter_proposal_by = 'challenged' AND v_participant.id != v_duel.challenger_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiante pode responder à contraproposta');
  END IF;
  IF v_duel.counter_proposal_by = 'challenger' AND v_participant.id != v_duel.challenged_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas o desafiado pode responder à contraproposta');
  END IF;

  IF p_accept THEN
    v_bet := v_duel.counter_proposal_points;

    -- Get customer IDs
    SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
    SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

    -- Validate both balances
    SELECT points_balance INTO v_challenger_balance FROM customers WHERE id = v_challenger_customer_id;
    IF v_challenger_balance IS NULL OR v_challenger_balance < v_bet THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo do desafiante insuficiente para o valor acordado');
    END IF;

    SELECT points_balance INTO v_challenged_balance FROM customers WHERE id = v_challenged_customer_id;
    IF v_challenged_balance IS NULL OR v_challenged_balance < v_bet THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo do desafiado insuficiente para o valor acordado');
    END IF;

    -- Debit challenger
    UPDATE customers SET points_balance = points_balance - v_bet WHERE id = v_challenger_customer_id;
    INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
    VALUES (v_challenger_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

    -- Debit challenged
    UPDATE customers SET points_balance = points_balance - v_bet WHERE id = v_challenged_customer_id;
    INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
    VALUES (v_challenged_customer_id, v_duel.brand_id, v_duel.branch_id, 'DEBIT', v_bet, 'Reserva de pontos - Duelo', 'DUEL_RESERVE', v_duel.id, NULL);

    -- Update duel
    UPDATE driver_duels SET
      status = 'accepted', accepted_at = now(),
      challenger_points_bet = v_bet,
      challenged_points_bet = v_bet,
      negotiation_status = 'agreed',
      points_reserved = true
    WHERE id = p_duel_id;

    RETURN jsonb_build_object('success', true, 'new_status', 'accepted', 'agreed_bet', v_bet);
  ELSE
    UPDATE driver_duels SET
      status = 'canceled',
      negotiation_status = 'rejected'
    WHERE id = p_duel_id;

    RETURN jsonb_build_object('success', true, 'new_status', 'canceled');
  END IF;
END;
$function$;

-- 7. Recriar finalize_duel com liquidação de pontos
CREATE OR REPLACE FUNCTION public.finalize_duel(p_duel_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_challenger_customer_id uuid;
  v_challenged_customer_id uuid;
  v_challenger_count bigint;
  v_challenged_count bigint;
  v_winner uuid;
  v_total_bet integer;
BEGIN
  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id AND status IN ('accepted','live');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado ou não pode ser finalizado');
  END IF;

  SELECT customer_id INTO v_challenger_customer_id FROM driver_duel_participants WHERE id = v_duel.challenger_id;
  SELECT customer_id INTO v_challenged_customer_id FROM driver_duel_participants WHERE id = v_duel.challenged_id;

  v_challenger_count := count_duel_rides(v_challenger_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);
  v_challenged_count := count_duel_rides(v_challenged_customer_id, v_duel.branch_id, v_duel.start_at, v_duel.end_at);

  IF v_challenger_count > v_challenged_count THEN
    v_winner := v_duel.challenger_id;
  ELSIF v_challenged_count > v_challenger_count THEN
    v_winner := v_duel.challenged_id;
  ELSE
    v_winner := NULL;
  END IF;

  -- Settle points if reserved
  IF v_duel.points_reserved AND NOT v_duel.points_settled THEN
    v_total_bet := v_duel.challenger_points_bet + v_duel.challenged_points_bet;

    IF v_winner IS NOT NULL THEN
      -- Winner gets total pot
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
      -- Draw: refund both
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
