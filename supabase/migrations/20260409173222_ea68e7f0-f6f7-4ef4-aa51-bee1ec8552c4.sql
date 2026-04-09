
-- 1. points_packages
CREATE TABLE public.points_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.points_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "root_admin full access on points_packages"
  ON public.points_packages FOR ALL
  USING (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "brand_admin manage own packages"
  ON public.points_packages FOR ALL
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "branch_admin read active packages"
  ON public.points_packages FOR SELECT
  USING (
    is_active = true
    AND brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
  );

CREATE TRIGGER update_points_packages_updated_at
  BEFORE UPDATE ON public.points_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. points_package_orders
CREATE TABLE public.points_package_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.points_packages(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  points_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  purchased_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

ALTER TABLE public.points_package_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "root_admin full access on orders"
  ON public.points_package_orders FOR ALL
  USING (public.has_role(auth.uid(), 'root_admin'));

CREATE POLICY "brand_admin manage orders"
  ON public.points_package_orders FOR ALL
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "branch_admin read own orders"
  ON public.points_package_orders FOR SELECT
  USING (branch_id IN (SELECT public.get_user_branch_ids(auth.uid())));

CREATE POLICY "branch_admin create orders"
  ON public.points_package_orders FOR INSERT
  WITH CHECK (
    branch_id IN (SELECT public.get_user_branch_ids(auth.uid()))
    AND status = 'PENDING'
  );

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_package_order_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('PENDING', 'CONFIRMED', 'CANCELLED') THEN
    RAISE EXCEPTION 'status must be PENDING, CONFIRMED, or CANCELLED';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_package_order_status_trigger
  BEFORE INSERT OR UPDATE ON public.points_package_orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_package_order_status();

-- 3. Function to confirm an order and credit wallet
CREATE OR REPLACE FUNCTION public.confirm_package_order(p_order_id uuid, p_confirmed_by uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_order points_package_orders%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_pkg_name text;
BEGIN
  SELECT * INTO v_order FROM points_package_orders WHERE id = p_order_id AND status = 'PENDING' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  SELECT name INTO v_pkg_name FROM points_packages WHERE id = v_order.package_id;

  -- Update order
  UPDATE points_package_orders SET status = 'CONFIRMED', confirmed_by = p_confirmed_by, confirmed_at = now() WHERE id = p_order_id;

  -- Credit wallet
  SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_order.branch_id FOR UPDATE;
  IF FOUND THEN
    v_new_balance := v_wallet.balance + v_order.points_amount;
    UPDATE branch_points_wallet SET balance = v_new_balance, total_loaded = total_loaded + v_order.points_amount, updated_at = now() WHERE id = v_wallet.id;
  ELSE
    v_new_balance := v_order.points_amount;
    INSERT INTO branch_points_wallet (branch_id, brand_id, balance, total_loaded) VALUES (v_order.branch_id, v_order.brand_id, v_new_balance, v_order.points_amount);
  END IF;

  INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description, created_by)
  VALUES (v_order.branch_id, v_order.brand_id, 'LOAD', v_order.points_amount, v_new_balance, 'Pacote: ' || COALESCE(v_pkg_name, 'N/A') || ' (' || v_order.points_amount || ' pts)', p_confirmed_by);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
