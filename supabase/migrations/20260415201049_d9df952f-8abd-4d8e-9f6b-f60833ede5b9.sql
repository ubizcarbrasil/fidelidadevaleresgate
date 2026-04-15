
-- =====================================================
-- 1. FIX confirm_driver_points_order RPC
-- Add auth check: caller must be authenticated admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.confirm_driver_points_order(p_order_id uuid, p_confirmed_by uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order driver_points_orders%ROWTYPE;
  v_wallet branch_points_wallet%ROWTYPE;
  v_new_balance numeric;
  v_caller_id uuid;
BEGIN
  -- Require authentication
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Autenticação obrigatória');
  END IF;

  -- Require admin role for the brand
  SELECT * INTO v_order FROM driver_points_orders WHERE id = p_order_id AND status = 'PENDING' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado ou já processado');
  END IF;

  -- Verify caller is brand_admin or root_admin for this brand
  IF NOT has_role(v_caller_id, 'root_admin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = v_caller_id
        AND role = 'brand_admin'
        AND brand_id = v_order.brand_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem confirmar pedidos');
    END IF;
  END IF;

  -- Credit customer points
  UPDATE customers SET points_balance = points_balance + v_order.points_amount WHERE id = v_order.customer_id;

  -- Ledger entry
  INSERT INTO points_ledger (customer_id, brand_id, branch_id, entry_type, points_amount, reason, reference_type, reference_id, created_by_user_id)
  VALUES (v_order.customer_id, v_order.brand_id, v_order.branch_id, 'CREDIT', v_order.points_amount,
          'Compra de pontos: ' || v_order.points_amount || ' pts',
          'MANUAL_ADJUSTMENT', v_order.id, v_caller_id);

  -- Debit branch wallet if exists
  IF v_order.branch_id IS NOT NULL THEN
    SELECT * INTO v_wallet FROM branch_points_wallet WHERE branch_id = v_order.branch_id FOR UPDATE;
    IF FOUND THEN
      v_new_balance := v_wallet.balance - v_order.points_amount;
      UPDATE branch_points_wallet SET balance = v_new_balance, total_distributed = total_distributed + v_order.points_amount, updated_at = now() WHERE id = v_wallet.id;
      INSERT INTO branch_wallet_transactions (branch_id, brand_id, transaction_type, amount, balance_after, description, created_by)
      VALUES (v_order.branch_id, v_order.brand_id, 'DEBIT', v_order.points_amount, v_new_balance, 'Compra de pontos por motorista', v_caller_id);
    END IF;
  END IF;

  -- Update order
  UPDATE driver_points_orders SET status = 'CONFIRMED', confirmed_at = now(), confirmed_by = v_caller_id WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'points_credited', v_order.points_amount);
END;
$$;

-- Revoke public execution
REVOKE EXECUTE ON FUNCTION public.confirm_driver_points_order(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_driver_points_order(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirm_driver_points_order(uuid, uuid) TO authenticated;

-- =====================================================
-- 2. FIX driver_points_orders RLS
-- =====================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Public read own orders" ON public.driver_points_orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.driver_points_orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.driver_points_orders;

-- New scoped policies
CREATE POLICY "Customers read own orders"
ON public.driver_points_orders FOR SELECT
TO authenticated
USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'root_admin')
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
);

CREATE POLICY "Customers insert own orders"
ON public.driver_points_orders FOR INSERT
TO authenticated
WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins update orders"
ON public.driver_points_orders FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'root_admin')
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
);

CREATE POLICY "Admins delete orders"
ON public.driver_points_orders FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'root_admin')
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
);

-- =====================================================
-- 3. FIX driver-avatars storage policies
-- =====================================================

DROP POLICY IF EXISTS "Anyone can upload driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete driver avatars" ON storage.objects;

CREATE POLICY "Authenticated can upload driver avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated can update driver avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated can delete driver avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'driver-avatars');

-- =====================================================
-- 4. FIX SECURITY DEFINER views → SECURITY INVOKER
-- =====================================================

-- public_affiliate_deals_safe
CREATE OR REPLACE VIEW public.public_affiliate_deals_safe
WITH (security_invoker = true)
AS
SELECT id, brand_id, branch_id, title, description, image_url, price, original_price,
       affiliate_url, store_name, category, is_active, click_count, order_index,
       created_at, updated_at, store_logo_url, badge_label, category_id, origin,
       is_featured, is_flash_promo, visible_driver, marketplace, current_status,
       is_redeemable, redeem_points_cost, redeemable_by
FROM affiliate_deals
WHERE is_active = true;

-- public_brand_modules_safe
CREATE OR REPLACE VIEW public.public_brand_modules_safe
WITH (security_invoker = true)
AS
SELECT bm.brand_id, md.key AS module_key, bm.is_enabled
FROM brand_modules bm
JOIN module_definitions md ON md.id = bm.module_definition_id;

-- public_brands_safe (remove sensitive fields)
CREATE OR REPLACE VIEW public.public_brands_safe
WITH (security_invoker = true)
AS
SELECT id, name, slug, is_active, subscription_status, tenant_id,
       default_theme_id, home_layout_json, brand_settings_json,
       created_at, trial_expires_at
FROM brands;
