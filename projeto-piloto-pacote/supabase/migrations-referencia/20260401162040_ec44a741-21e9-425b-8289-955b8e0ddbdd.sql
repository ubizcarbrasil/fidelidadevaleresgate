
CREATE OR REPLACE FUNCTION public.get_driver_ride_stats(p_brand_id uuid, p_customer_ids uuid[])
RETURNS TABLE(customer_id uuid, total_rides bigint, total_ride_points numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    mr.driver_customer_id AS customer_id,
    COUNT(*)::bigint AS total_rides,
    COALESCE(SUM(mr.driver_points_credited), 0) AS total_ride_points
  FROM machine_rides mr
  WHERE mr.brand_id = p_brand_id
    AND mr.driver_customer_id = ANY(p_customer_ids)
    AND mr.ride_status = 'FINALIZED'
  GROUP BY mr.driver_customer_id;
$$;
