
CREATE OR REPLACE FUNCTION public.rpc_get_driver_city_redemptions(p_customer_id uuid)
RETURNS TABLE(
  id uuid,
  token text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  offer_title text,
  store_name text,
  store_logo_url text,
  value_rescue numeric,
  min_purchase numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    r.id,
    r.token,
    r.status::text,
    r.created_at,
    r.expires_at,
    r.used_at,
    COALESCE(o.title, '')::text AS offer_title,
    COALESCE(s.name, '')::text AS store_name,
    COALESCE(s.logo_url, '')::text AS store_logo_url,
    COALESCE(o.value_rescue, 0)::numeric AS value_rescue,
    COALESCE(o.min_purchase, 0)::numeric AS min_purchase
  FROM redemptions r
  JOIN offers o ON o.id = r.offer_id
  LEFT JOIN stores s ON s.id = o.store_id
  WHERE r.customer_id = p_customer_id
  ORDER BY r.created_at DESC
  LIMIT 50;
$$;
