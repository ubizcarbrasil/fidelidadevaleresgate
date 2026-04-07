
-- RPC: admin_boost_duel
CREATE OR REPLACE FUNCTION public.admin_boost_duel(
  p_duel_id uuid,
  p_amount integer,
  p_branch_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_duel driver_duels%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor deve ser maior que zero');
  END IF;

  SELECT * INTO v_duel FROM driver_duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não encontrado');
  END IF;

  IF v_duel.status NOT IN ('live', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duelo não está ativo');
  END IF;

  -- Debit wallet
  SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE branch_points_wallet
  SET balance = v_new_balance, total_distributed = total_distributed + p_amount, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
  VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_amount, v_new_balance, 'Impulso de duelo #' || LEFT(p_duel_id::text, 8));

  -- Add to prize_points
  UPDATE driver_duels SET prize_points = COALESCE(prize_points, 0) + p_amount WHERE id = p_duel_id;

  RETURN jsonb_build_object('success', true, 'new_prize', COALESCE(v_duel.prize_points, 0) + p_amount, 'wallet_balance', v_new_balance);
END;
$$;

-- RPC: admin_create_duel
CREATE OR REPLACE FUNCTION public.admin_create_duel(
  p_challenger_customer_id uuid,
  p_challenged_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_prize_points integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_duel_id uuid;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  IF p_challenger_customer_id = p_challenged_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não pode desafiar a si mesmo');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à data de fim');
  END IF;

  -- Validate participants
  SELECT * INTO v_challenger FROM driver_duel_participants
  WHERE customer_id = p_challenger_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiante não habilitado para duelos');
  END IF;

  SELECT * INTO v_challenged FROM driver_duel_participants
  WHERE customer_id = p_challenged_customer_id AND branch_id = p_branch_id AND duels_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Desafiado não habilitado para duelos');
  END IF;

  -- Create duel directly as accepted
  INSERT INTO driver_duels (branch_id, brand_id, challenger_id, challenged_id, start_at, end_at, status, accepted_at, prize_points)
  VALUES (p_branch_id, p_brand_id, v_challenger.id, v_challenged.id, p_start_at, p_end_at, 'accepted', now(), p_prize_points)
  RETURNING id INTO v_duel_id;

  -- Debit wallet if prize > 0
  IF p_prize_points > 0 THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
    END IF;

    v_new_balance := v_wallet.balance - p_prize_points;

    UPDATE branch_points_wallet
    SET balance = v_new_balance, total_distributed = total_distributed + p_prize_points, updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
    VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_prize_points, v_new_balance, 'Prêmio de duelo criado pelo admin #' || LEFT(v_duel_id::text, 8));
  END IF;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$$;
