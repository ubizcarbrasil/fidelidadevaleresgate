-- 1. Add duel_origin column
ALTER TABLE public.driver_duels
  ADD COLUMN IF NOT EXISTS duel_origin text NOT NULL DEFAULT 'DRIVER_VS_DRIVER'
  CHECK (duel_origin IN ('DRIVER_VS_DRIVER','SPONSORED'));

-- 2. Backfill from sponsored_by_brand
UPDATE public.driver_duels
SET duel_origin = 'SPONSORED'
WHERE sponsored_by_brand = true AND duel_origin = 'DRIVER_VS_DRIVER';

CREATE INDEX IF NOT EXISTS idx_driver_duels_origin ON public.driver_duels (duel_origin);

-- 3. Rewrite finalize_duel with bifurcation by duel_origin
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
  v_winner_customer_id uuid;
  v_total_bet integer;
  v_side_bet_result jsonb;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_settled boolean := false;
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
    v_winner_customer_id := v_challenger_customer_id;
  ELSIF v_challenged_count > v_challenger_count THEN
    v_winner := v_duel.challenged_id;
    v_winner_customer_id := v_challenged_customer_id;
  ELSE
    v_winner := NULL;
    v_winner_customer_id := NULL;
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
    v_duel.points_reserved OR v_duel.duel_origin = 'SPONSORED'
  );

  -- =================================================================
  -- BIFURCAÇÃO POR ORIGEM DO PRÊMIO
  -- =================================================================

  IF v_duel.duel_origin = 'SPONSORED' THEN
    -- Duelo patrocinado: prêmio bancado pela carteira da cidade (já debitado na criação)
    -- Ignora challenger_points_bet / challenged_points_bet
    IF COALESCE(v_duel.prize_points, 0) > 0 AND NOT v_duel.points_settled THEN
      IF v_winner_customer_id IS NOT NULL THEN
        -- Vitória: vencedor recebe prize_points integral
        UPDATE customers SET points_balance = points_balance + v_duel.prize_points WHERE id = v_winner_customer_id;
        INSERT INTO points_ledger (
          customer_id, brand_id, branch_id, entry_type, points_amount,
          reason, reference_type, reference_id, created_by_user_id
        ) VALUES (
          v_winner_customer_id, v_duel.brand_id, v_duel.branch_id, 'CREDIT', v_duel.prize_points,
          'Prêmio de Duelo Patrocinado', 'DUEL_PRIZE', v_duel.id, NULL
        );
      ELSE
        -- Empate: estorna prize_points para a carteira da cidade
        SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_duel.branch_id FOR UPDATE;
        IF FOUND THEN
          v_new_balance := v_wallet.balance + v_duel.prize_points;
          UPDATE branch_points_wallet
          SET balance = v_new_balance,
              total_distributed = GREATEST(0, total_distributed - v_duel.prize_points),
              updated_at = now()
          WHERE id = v_wallet.id;

          INSERT INTO branch_wallet_transactions (
            branch_id, brand_id, transaction_type, amount, balance_after, description
          ) VALUES (
            v_duel.branch_id, v_duel.brand_id, 'CREDIT', v_duel.prize_points, v_new_balance,
            'Estorno de duelo patrocinado empatado #' || LEFT(v_duel.id::text, 8)
          );
        END IF;
      END IF;
      v_settled := true;
    END IF;

  ELSE
    -- Duelo entre motoristas: mecânica de escrow (mantida)
    IF v_duel.points_reserved AND NOT v_duel.points_settled THEN
      v_total_bet := COALESCE(v_duel.challenger_points_bet, 0) + COALESCE(v_duel.challenged_points_bet, 0);

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
      v_settled := true;
    END IF;
  END IF;

  -- Apostas paralelas continuam liquidando independente da modalidade
  v_side_bet_result := settle_side_bets(p_duel_id, v_winner);

  UPDATE driver_duels
  SET status = 'finished',
      challenger_rides_count = v_challenger_count,
      challenged_rides_count = v_challenged_count,
      winner_id = v_winner,
      finished_at = now(),
      points_settled = CASE WHEN v_settled THEN true ELSE points_settled END
  WHERE id = p_duel_id;

  RETURN jsonb_build_object(
    'success', true,
    'challenger_rides', v_challenger_count,
    'challenged_rides', v_challenged_count,
    'winner_id', v_winner,
    'duel_origin', v_duel.duel_origin,
    'points_settled', v_settled,
    'side_bets', v_side_bet_result
  );
END;
$function$;

-- 4. admin_create_duel: marca origin = SPONSORED
CREATE OR REPLACE FUNCTION public.admin_create_duel(
  p_challenger_customer_id uuid,
  p_challenged_customer_id uuid,
  p_branch_id uuid,
  p_brand_id uuid,
  p_start_at timestamp with time zone,
  p_end_at timestamp with time zone,
  p_prize_points integer DEFAULT 0
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Cria duelo já como SPONSORED (admin = empreendedor banca)
  INSERT INTO driver_duels (
    branch_id, brand_id, challenger_id, challenged_id,
    start_at, end_at, status, accepted_at,
    prize_points, sponsored_by_brand, duel_origin
  )
  VALUES (
    p_branch_id, p_brand_id, v_challenger.id, v_challenged.id,
    p_start_at, p_end_at, 'accepted', now(),
    p_prize_points, true, 'SPONSORED'
  )
  RETURNING id INTO v_duel_id;

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
    VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_prize_points, v_new_balance,
      'Prêmio de duelo patrocinado #' || LEFT(v_duel_id::text, 8));
  END IF;

  RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$function$;

-- 5. admin_create_bulk_duels: marca origin = SPONSORED
CREATE OR REPLACE FUNCTION public.admin_create_bulk_duels(
  p_branch_id uuid,
  p_brand_id uuid,
  p_pairs jsonb,
  p_start_at timestamp with time zone,
  p_end_at timestamp with time zone,
  p_prize_points_per_pair integer DEFAULT 0,
  p_sponsored boolean DEFAULT true
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pair jsonb;
  v_challenger_cust uuid;
  v_challenged_cust uuid;
  v_challenger driver_duel_participants%ROWTYPE;
  v_challenged driver_duel_participants%ROWTYPE;
  v_total_pairs int := 0;
  v_total_cost numeric := 0;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_created_ids uuid[] := ARRAY[]::uuid[];
  v_duel_id uuid;
BEGIN
  IF p_pairs IS NULL OR jsonb_typeof(p_pairs) <> 'array' OR jsonb_array_length(p_pairs) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum par informado');
  END IF;

  IF p_start_at >= p_end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Data de início deve ser anterior à de fim');
  END IF;

  v_total_pairs := jsonb_array_length(p_pairs);
  v_total_cost := v_total_pairs * GREATEST(p_prize_points_per_pair, 0);

  IF v_total_cost > 0 THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Carteira da cidade não encontrada');
    END IF;
    IF v_wallet.balance < v_total_cost THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Saldo insuficiente',
        'balance', v_wallet.balance,
        'required', v_total_cost
      );
    END IF;
  END IF;

  FOR v_pair IN SELECT * FROM jsonb_array_elements(p_pairs)
  LOOP
    v_challenger_cust := (v_pair->>'challenger_customer_id')::uuid;
    v_challenged_cust := (v_pair->>'challenged_customer_id')::uuid;

    IF v_challenger_cust IS NULL OR v_challenged_cust IS NULL OR v_challenger_cust = v_challenged_cust THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_challenger FROM driver_duel_participants
    WHERE customer_id = v_challenger_cust AND branch_id = p_branch_id AND duels_enabled = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT * INTO v_challenged FROM driver_duel_participants
    WHERE customer_id = v_challenged_cust AND branch_id = p_branch_id AND duels_enabled = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    INSERT INTO driver_duels (
      branch_id, brand_id, challenger_id, challenged_id,
      start_at, end_at, status, accepted_at,
      prize_points, sponsored_by_brand, duel_origin
    ) VALUES (
      p_branch_id, p_brand_id, v_challenger.id, v_challenged.id,
      p_start_at, p_end_at, 'accepted', NOW(),
      GREATEST(p_prize_points_per_pair, 0), true, 'SPONSORED'
    )
    RETURNING id INTO v_duel_id;

    v_created_ids := array_append(v_created_ids, v_duel_id);
  END LOOP;

  v_total_cost := COALESCE(array_length(v_created_ids, 1), 0) * GREATEST(p_prize_points_per_pair, 0);

  IF v_total_cost > 0 AND v_wallet.id IS NOT NULL THEN
    v_new_balance := v_wallet.balance - v_total_cost;

    UPDATE branch_points_wallet
    SET balance = v_new_balance,
        total_distributed = total_distributed + v_total_cost,
        updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO branch_wallet_transactions (
      branch_id, brand_id, transaction_type, amount, balance_after, description
    ) VALUES (
      p_branch_id, p_brand_id, 'DEBIT', v_total_cost, v_new_balance,
      'Lote de duelos patrocinados — ' || COALESCE(array_length(v_created_ids, 1), 0)::text || ' duelos × ' || p_prize_points_per_pair::text || ' pts'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'created_count', COALESCE(array_length(v_created_ids, 1), 0),
    'requested_count', v_total_pairs,
    'total_cost', v_total_cost,
    'duel_ids', to_jsonb(v_created_ids)
  );
END;
$function$;