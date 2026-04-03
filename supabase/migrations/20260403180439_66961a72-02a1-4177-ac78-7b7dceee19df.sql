
-- 1. Atualizar RPC para permitir saldo negativo
CREATE OR REPLACE FUNCTION public.debit_branch_wallet(p_branch_id uuid, p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_wallet
  FROM branch_points_wallet
  WHERE branch_id = p_branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada para esta cidade');
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE branch_points_wallet
  SET balance = v_new_balance,
      total_distributed = total_distributed + p_amount,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description)
  VALUES (p_branch_id, v_wallet.brand_id, 'DEBIT', p_amount, v_new_balance, p_description);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$function$;

-- 2. Sincronizar wallets existentes com dados reais
UPDATE branch_points_wallet bpw
SET total_distributed = sub.total,
    balance = bpw.total_loaded - sub.total,
    updated_at = now()
FROM (
  SELECT branch_id, COALESCE(SUM(driver_points_credited), 0) AS total
  FROM machine_rides WHERE ride_status = 'FINALIZED'
  GROUP BY branch_id
) sub
WHERE bpw.branch_id = sub.branch_id;
