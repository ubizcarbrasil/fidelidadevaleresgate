
CREATE OR REPLACE FUNCTION public.get_city_driver_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(rank_position bigint, customer_id uuid, driver_name text, total_rides bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::bigint AS rank_position,
    mr.driver_customer_id AS customer_id,
    MAX(mr.driver_name)::text AS driver_name,
    COUNT(*)::bigint AS total_rides
  FROM machine_rides mr
  WHERE mr.branch_id = p_branch_id
    AND mr.ride_status = 'FINALIZED'
    AND mr.finalized_at >= date_trunc('month', now())
    AND mr.driver_customer_id IS NOT NULL
  GROUP BY mr.driver_customer_id
  ORDER BY total_rides DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_driver_city_position(p_branch_id uuid, p_customer_id uuid)
RETURNS TABLE(rank_position bigint, total_rides bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::bigint AS rank_position,
      mr.driver_customer_id AS customer_id,
      COUNT(*)::bigint AS total_rides
    FROM machine_rides mr
    WHERE mr.branch_id = p_branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.finalized_at >= date_trunc('month', now())
      AND mr.driver_customer_id IS NOT NULL
    GROUP BY mr.driver_customer_id
  )
  SELECT r.rank_position, r.total_rides
  FROM ranked r
  WHERE r.customer_id = p_customer_id;
$$;
