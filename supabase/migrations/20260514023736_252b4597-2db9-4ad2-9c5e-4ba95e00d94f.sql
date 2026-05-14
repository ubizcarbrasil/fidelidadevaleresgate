
CREATE OR REPLACE FUNCTION public.get_drivers_ranking_for_season(
  p_branch_id uuid,
  p_since_days integer DEFAULT 30
)
RETURNS TABLE(
  rank_position bigint,
  customer_id uuid,
  driver_name text,
  phone text,
  rides_count bigint,
  points_balance numeric,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH rides AS (
    SELECT
      mr.driver_customer_id,
      COUNT(*)::bigint AS total
    FROM public.machine_rides mr
    WHERE mr.branch_id = p_branch_id
      AND mr.ride_status = 'FINALIZED'
      AND mr.driver_customer_id IS NOT NULL
      AND mr.finalized_at >= (now() - make_interval(days => GREATEST(p_since_days, 1)))
    GROUP BY mr.driver_customer_id
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(r.total, 0) DESC, c.points_balance DESC, c.name ASC
    )::bigint AS rank_position,
    c.id AS customer_id,
    c.name AS driver_name,
    c.phone,
    COALESCE(r.total, 0)::bigint AS rides_count,
    c.points_balance,
    c.is_active
  FROM public.customers c
  LEFT JOIN rides r ON r.driver_customer_id = c.id
  WHERE c.branch_id = p_branch_id
    AND c.is_driver = true
    AND c.is_active = true
  ORDER BY rank_position ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_drivers_ranking_for_season(uuid, integer) TO authenticated;
