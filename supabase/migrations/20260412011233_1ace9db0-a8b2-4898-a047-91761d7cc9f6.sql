
CREATE OR REPLACE FUNCTION public.process_product_redemption(
  p_customer_id uuid,
  p_brand_id uuid,
  p_branch_id uuid,
  p_deal_id uuid,
  p_deal_snapshot jsonb,
  p_affiliate_url text,
  p_points_cost integer,
  p_name text,
  p_phone text,
  p_cpf text,
  p_cep text,
  p_address text,
  p_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_state text,
  p_order_source text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_balance numeric;
  v_order_id uuid;
BEGIN
  -- Lock customer row and check balance
  SELECT points_balance INTO v_balance
  FROM customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  IF v_balance < p_points_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente: % pts disponíveis, % pts necessários', v_balance, p_points_cost;
  END IF;

  -- 1. Insert debit into points_ledger
  INSERT INTO points_ledger (
    customer_id, brand_id, branch_id,
    entry_type, points_amount, reason,
    reference_type, created_by_user_id
  ) VALUES (
    p_customer_id, p_brand_id, p_branch_id,
    'DEBIT', p_points_cost, 'Resgate: ' || (p_deal_snapshot->>'title'),
    'REDEMPTION', NULL
  );

  -- 2. Decrement customer balance
  UPDATE customers
  SET points_balance = v_balance - p_points_cost
  WHERE id = p_customer_id;

  -- 3. Create redemption order
  INSERT INTO product_redemption_orders (
    brand_id, branch_id, customer_id, deal_id,
    deal_snapshot_json, affiliate_url, points_spent,
    customer_name, customer_phone, customer_cpf,
    delivery_cep, delivery_address, delivery_number,
    delivery_complement, delivery_neighborhood,
    delivery_city, delivery_state, order_source
  ) VALUES (
    p_brand_id, p_branch_id, p_customer_id, p_deal_id,
    p_deal_snapshot, p_affiliate_url, p_points_cost,
    p_name, p_phone, NULLIF(p_cpf, ''),
    p_cep, p_address, p_number,
    NULLIF(p_complement, ''), p_neighborhood,
    p_city, p_state, p_order_source
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
