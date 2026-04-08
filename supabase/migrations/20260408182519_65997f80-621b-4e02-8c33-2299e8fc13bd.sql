
-- 1. Add columns
ALTER TABLE public.city_belt_champions
  ADD COLUMN IF NOT EXISTS belt_prize_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_manually boolean NOT NULL DEFAULT false;

-- 2. Drop old function signature
DROP FUNCTION IF EXISTS public.get_city_belt_champion(uuid);

-- 3. Recreate with new columns
CREATE OR REPLACE FUNCTION public.get_city_belt_champion(p_branch_id uuid)
RETURNS TABLE(
  id uuid,
  branch_id uuid,
  champion_customer_id uuid,
  champion_name text,
  champion_nickname text,
  champion_avatar_url text,
  record_value bigint,
  record_type text,
  achieved_at timestamptz,
  belt_prize_points integer,
  assigned_manually boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cbc.id,
    cbc.branch_id,
    cbc.champion_customer_id,
    c.name AS champion_name,
    ddp.public_nickname AS champion_nickname,
    ddp.avatar_url AS champion_avatar_url,
    cbc.record_value,
    cbc.record_type,
    cbc.achieved_at,
    cbc.belt_prize_points,
    cbc.assigned_manually
  FROM city_belt_champions cbc
  JOIN customers c ON c.id = cbc.champion_customer_id
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = cbc.champion_customer_id
  WHERE cbc.branch_id = p_branch_id
  ORDER BY cbc.record_type
  LIMIT 2;
$$;

-- 4. RPC: assign_city_belt_manual
CREATE OR REPLACE FUNCTION public.assign_city_belt_manual(
  p_branch_id uuid,
  p_brand_id uuid,
  p_customer_id uuid,
  p_record_value integer,
  p_prize_points integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at, belt_prize_points, assigned_manually)
  VALUES (p_branch_id, p_brand_id, p_customer_id, p_record_value, 'monthly', now(), p_prize_points, true)
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at,
    belt_prize_points = EXCLUDED.belt_prize_points,
    assigned_manually = true,
    updated_at = now();

  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at, belt_prize_points, assigned_manually)
  VALUES (p_branch_id, p_brand_id, p_customer_id, p_record_value, 'all_time', now(), 0, true)
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at,
    assigned_manually = true,
    updated_at = now()
  WHERE EXCLUDED.record_value > city_belt_champions.record_value;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. Update update_city_belt with prize logic
CREATE OR REPLACE FUNCTION public.update_city_belt(p_branch_id uuid, p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_top_customer_id uuid;
  v_top_rides bigint;
  v_current_champion uuid;
  v_current_record bigint;
  v_prize integer;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  SELECT mr.driver_customer_id, COUNT(*)::bigint
  INTO v_top_customer_id, v_top_rides
  FROM machine_rides mr
  WHERE mr.branch_id = p_branch_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.finalized_at >= date_trunc('month', now())
    AND mr.driver_customer_id IS NOT NULL
  GROUP BY mr.driver_customer_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_top_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma corrida encontrada no período');
  END IF;

  SELECT champion_customer_id, record_value, belt_prize_points
  INTO v_current_champion, v_current_record, v_prize
  FROM city_belt_champions
  WHERE branch_id = p_branch_id AND record_type = 'monthly';

  IF v_current_champion = v_top_customer_id AND v_current_record = v_top_rides THEN
    RETURN jsonb_build_object('success', true, 'changed', false);
  END IF;

  -- Prize distribution when belt changes hands
  IF v_current_champion IS NOT NULL
     AND v_current_champion IS DISTINCT FROM v_top_customer_id
     AND v_top_rides > v_current_record
     AND COALESCE(v_prize, 0) > 0 THEN

    UPDATE customers SET points_balance = points_balance + v_prize WHERE id = v_top_customer_id;

    INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
    VALUES (v_top_customer_id, p_brand_id, p_branch_id, 'CREDIT', v_prize,
            'Tomou o Cinturão da Cidade! Prêmio de ' || v_prize || ' pts', 'BELT_PRIZE', NULL, NULL);

    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = p_branch_id FOR UPDATE;
    IF FOUND THEN
      v_new_balance := v_wallet.balance - v_prize;
      UPDATE branch_points_wallet SET balance = v_new_balance, total_distributed = total_distributed + v_prize, updated_at = now() WHERE id = v_wallet.id;
      INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
      VALUES (p_branch_id, p_brand_id, 'DEBIT', v_prize, v_new_balance, 'Prêmio Cinturão da Cidade');
    END IF;
  END IF;

  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at, belt_prize_points, assigned_manually)
  VALUES (p_branch_id, p_brand_id, v_top_customer_id, v_top_rides, 'monthly', now(), 0, false)
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at,
    belt_prize_points = 0,
    assigned_manually = false;

  INSERT INTO city_belt_champions (branch_id, brand_id, champion_customer_id, record_value, record_type, achieved_at)
  VALUES (p_branch_id, p_brand_id, v_top_customer_id, v_top_rides, 'all_time', now())
  ON CONFLICT (branch_id, record_type)
  DO UPDATE SET
    champion_customer_id = EXCLUDED.champion_customer_id,
    record_value = EXCLUDED.record_value,
    achieved_at = EXCLUDED.achieved_at
  WHERE EXCLUDED.record_value > city_belt_champions.record_value;

  RETURN jsonb_build_object('success', true, 'changed', true, 'champion_customer_id', v_top_customer_id, 'record_value', v_top_rides, 'prize_awarded', COALESCE(v_prize, 0));
END;
$$;
