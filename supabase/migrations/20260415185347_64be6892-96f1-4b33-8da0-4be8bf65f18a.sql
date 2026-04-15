
-- Config table for points pricing per brand
CREATE TABLE public.driver_points_purchase_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  price_per_thousand_cents INTEGER NOT NULL DEFAULT 7000,
  min_points INTEGER NOT NULL DEFAULT 1000,
  max_points INTEGER NOT NULL DEFAULT 300000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

ALTER TABLE public.driver_points_purchase_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.driver_points_purchase_config
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage" ON public.driver_points_purchase_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_driver_points_purchase_config_updated_at
  BEFORE UPDATE ON public.driver_points_purchase_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders table
CREATE TABLE public.driver_points_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID
);

ALTER TABLE public.driver_points_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read own orders" ON public.driver_points_orders
  FOR SELECT USING (true);

CREATE POLICY "Public can insert orders" ON public.driver_points_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can update orders" ON public.driver_points_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_driver_points_orders_updated_at
  BEFORE UPDATE ON public.driver_points_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_driver_points_order_status()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'CONFIRMED', 'CANCELLED') THEN
    RAISE EXCEPTION 'status must be PENDING, CONFIRMED, or CANCELLED';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_driver_points_order_status_trigger
  BEFORE INSERT OR UPDATE ON public.driver_points_orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_driver_points_order_status();

-- RPC to confirm an order and credit points
CREATE OR REPLACE FUNCTION public.confirm_driver_points_order(p_order_id uuid, p_confirmed_by uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_order driver_points_orders%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
BEGIN
  SELECT * INTO v_order FROM driver_points_orders WHERE id = p_order_id AND status = 'PENDING' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  -- Credit customer points
  UPDATE customers SET points_balance = points_balance + v_order.points_amount WHERE id = v_order.customer_id;

  -- Ledger entry
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
  VALUES (v_order.customer_id, v_order.brand_id, v_order.branch_id, 'CREDIT', v_order.points_amount,
          'Compra de pontos: ' || v_order.points_amount || ' pts',
          'MANUAL_ADJUSTMENT', v_order.id, p_confirmed_by);

  -- Debit branch wallet if exists
  IF v_order.branch_id IS NOT NULL THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_order.branch_id FOR UPDATE;
    IF FOUND THEN
      v_new_balance := v_wallet.balance - v_order.points_amount;
      UPDATE branch_points_wallet SET balance = v_new_balance, total_distributed = total_distributed + v_order.points_amount, updated_at = now() WHERE id = v_wallet.id;
      INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description, created_by)
      VALUES (v_order.branch_id, v_order.brand_id, 'DEBIT', v_order.points_amount, v_new_balance, 'Compra de pontos por motorista', p_confirmed_by);
    END IF;
  END IF;

  -- Update order
  UPDATE driver_points_orders SET status = 'CONFIRMED', confirmed_at = now(), confirmed_by = p_confirmed_by WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'points_credited', v_order.points_amount);
END;
$$;
