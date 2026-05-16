
-- 1. Tabela branch_points_wallet
CREATE TABLE public.branch_points_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  total_loaded numeric DEFAULT 0 NOT NULL,
  total_distributed numeric DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(branch_id)
);

ALTER TABLE public.branch_points_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_admin can manage own brand wallets"
  ON public.branch_points_wallet FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "branch_admin can view own branch wallet"
  ON public.branch_points_wallet FOR SELECT TO authenticated
  USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "root_admin full access wallets"
  ON public.branch_points_wallet FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

-- 2. Tabela branch_wallet_transactions
CREATE TABLE public.branch_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.branch_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_admin can manage own brand wallet txns"
  ON public.branch_wallet_transactions FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "branch_admin can view own branch wallet txns"
  ON public.branch_wallet_transactions FOR SELECT TO authenticated
  USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "root_admin full access wallet txns"
  ON public.branch_wallet_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'root_admin'));

-- 3. Inserir módulo achadinhos_motorista
INSERT INTO public.module_definitions (key, name, description, customer_facing, is_core)
VALUES ('achadinhos_motorista', 'Achadinhos Motorista', 'Módulo de gestão de motoristas, pontuação e resgates por cidade', false, false)
ON CONFLICT DO NOTHING;

-- 4. RPC debit_branch_wallet
CREATE OR REPLACE FUNCTION public.debit_branch_wallet(
  p_branch_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  -- Lock the wallet row
  SELECT * INTO v_wallet
  FROM branch_points_wallet
  WHERE branch_id = p_branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada para esta cidade');
  END IF;

  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente', 'balance', v_wallet.balance, 'requested', p_amount);
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
$$;

-- 5. RPC get_branch_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_branch_dashboard_stats(p_branch_id uuid)
RETURNS TABLE(
  total_rides bigint,
  total_drivers bigint,
  total_points_distributed numeric,
  total_redemptions bigint,
  wallet_balance numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*)::bigint FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') AS total_rides,
    (SELECT COUNT(*)::bigint FROM customers WHERE branch_id = p_branch_id AND name ILIKE '%[MOTORISTA]%' AND is_active = true) AS total_drivers,
    (SELECT COALESCE(SUM(driver_points_credited), 0) FROM machine_rides WHERE branch_id = p_branch_id AND ride_status = 'FINALIZED') AS total_points_distributed,
    (SELECT COUNT(*)::bigint FROM product_redemption_orders WHERE branch_id = p_branch_id) AS total_redemptions,
    (SELECT COALESCE(balance, 0) FROM branch_points_wallet WHERE branch_id = p_branch_id) AS wallet_balance;
$$;

-- 6. Trigger updated_at
CREATE TRIGGER update_branch_points_wallet_updated_at
  BEFORE UPDATE ON public.branch_points_wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
