
CREATE OR REPLACE FUNCTION public.credit_customer_points(
  p_customer_id uuid,
  p_brand_id uuid,
  p_branch_id uuid,
  p_points integer,
  p_money numeric DEFAULT 0,
  p_reason text DEFAULT '',
  p_reference_type text DEFAULT 'MACHINE_RIDE'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance numeric;
BEGIN
  SELECT points_balance INTO v_current_balance
  FROM customers WHERE id = p_customer_id FOR UPDATE;

  UPDATE customers
  SET points_balance = points_balance + p_points
  WHERE id = p_customer_id;

  INSERT INTO points_ledger (
    customer_id, brand_id, branch_id,
    entry_type, points_amount, reason,
    reference_type, created_by_user_id
  ) VALUES (
    p_customer_id, p_brand_id, p_branch_id,
    'CREDIT', p_points, p_reason,
    p_reference_type, NULL
  );
END;
$$;
