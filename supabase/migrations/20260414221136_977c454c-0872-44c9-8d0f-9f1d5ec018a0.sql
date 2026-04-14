
CREATE OR REPLACE FUNCTION public.get_rides_report_by_branch(p_brand_id uuid)
RETURNS TABLE(
  branch_id uuid,
  branch_name text,
  branch_city text,
  branch_state text,
  total_rides bigint,
  total_ride_value numeric,
  total_driver_points bigint,
  total_client_points bigint,
  total_drivers bigint,
  rides_current_month bigint,
  rides_prev_month bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    b.id AS branch_id,
    b.name AS branch_name,
    COALESCE(b.city, b.name) AS branch_city,
    COALESCE(b.state, '') AS branch_state,
    COUNT(mr.id)::bigint AS total_rides,
    COALESCE(SUM(mr.ride_value), 0)::numeric AS total_ride_value,
    COALESCE(SUM(mr.driver_points_credited), 0)::bigint AS total_driver_points,
    COALESCE(SUM(mr.points_credited), 0)::bigint AS total_client_points,
    COUNT(DISTINCT mr.driver_customer_id)::bigint AS total_drivers,
    COUNT(CASE WHEN mr.finalized_at >= date_trunc('month', now()) THEN 1 END)::bigint AS rides_current_month,
    COUNT(CASE WHEN mr.finalized_at >= date_trunc('month', now()) - interval '1 month'
                 AND mr.finalized_at < date_trunc('month', now()) THEN 1 END)::bigint AS rides_prev_month
  FROM branches b
  LEFT JOIN machine_rides mr ON mr.branch_id = b.id AND mr.ride_status = 'FINALIZED'
  WHERE b.brand_id = p_brand_id
  GROUP BY b.id, b.name, b.city, b.state
  ORDER BY total_rides DESC;
$$;
