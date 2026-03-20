
CREATE OR REPLACE FUNCTION public.rpc_get_store_owner_redemptions(
  p_store_id uuid,
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  token text,
  status text,
  created_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz,
  customer_cpf text,
  offer_title text,
  customer_name text,
  customer_phone text,
  branch_name text,
  value_rescue numeric,
  min_purchase numeric,
  coupon_type text,
  offer_end_at timestamptz,
  purchase_value numeric,
  credit_value_applied numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM stores WHERE stores.id = p_store_id AND stores.owner_user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.token,
    r.status,
    r.created_at,
    r.used_at,
    r.expires_at,
    r.customer_cpf,
    COALESCE(o.title, '') AS offer_title,
    COALESCE(c.name, '—') AS customer_name,
    COALESCE(c.phone, '') AS customer_phone,
    COALESCE(b.name, '') AS branch_name,
    COALESCE(o.value_rescue, 0) AS value_rescue,
    COALESCE(o.min_purchase, 0) AS min_purchase,
    COALESCE(o.coupon_type, 'STORE') AS coupon_type,
    o.end_at AS offer_end_at,
    r.purchase_value,
    r.credit_value_applied
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN branches b ON b.id = r.branch_id
  WHERE o.store_id = p_store_id
    AND r.status IN ('PENDING', 'USED')
  ORDER BY r.created_at DESC
  OFFSET p_page * p_page_size
  LIMIT p_page_size;
END;
$$;
