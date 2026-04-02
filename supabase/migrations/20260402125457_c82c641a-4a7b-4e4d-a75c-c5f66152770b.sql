
CREATE OR REPLACE FUNCTION public.rpc_get_store_owner_redemptions(p_store_id uuid, p_page integer DEFAULT 0, p_page_size integer DEFAULT 30)
 RETURNS TABLE(id uuid, token text, status text, created_at timestamp with time zone, used_at timestamp with time zone, expires_at timestamp with time zone, customer_cpf text, offer_title text, customer_name text, customer_phone text, branch_name text, value_rescue numeric, min_purchase numeric, coupon_type text, offer_end_at timestamp with time zone, purchase_value numeric, credit_value_applied numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = p_store_id
      AND (
        s.owner_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'root_admin')
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role = 'brand_admin'
            AND ur.brand_id = s.brand_id
        )
      )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.token,
    r.status::text,
    r.created_at,
    r.used_at,
    r.expires_at,
    r.customer_cpf,
    COALESCE(o.title, '')::text AS offer_title,
    COALESCE(c.name, '—')::text AS customer_name,
    COALESCE(c.phone, '')::text AS customer_phone,
    COALESCE(b.name, '')::text AS branch_name,
    COALESCE(o.value_rescue, 0)::numeric AS value_rescue,
    COALESCE(o.min_purchase, 0)::numeric AS min_purchase,
    COALESCE(o.coupon_type, 'STORE')::text AS coupon_type,
    o.end_at AS offer_end_at,
    r.purchase_value,
    r.credit_value_applied
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN branches b ON b.id = r.branch_id
  WHERE o.store_id = p_store_id
    AND r.status IN ('PENDING', 'USED', 'EXPIRED')
  ORDER BY
    CASE r.status
      WHEN 'PENDING' THEN 0
      WHEN 'EXPIRED' THEN 1
      WHEN 'USED' THEN 2
    END,
    r.created_at DESC
  OFFSET p_page * p_page_size
  LIMIT p_page_size;
END;
$function$;
