CREATE OR REPLACE FUNCTION public.get_points_summary(p_brand_id uuid)
RETURNS TABLE(driver_points_total bigint, client_points_total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(driver_points_credited), 0)::bigint AS driver_points_total,
    COALESCE(SUM(points_credited), 0)::bigint AS client_points_total
  FROM machine_rides
  WHERE ride_status = 'FINALIZED'
    AND brand_id = p_brand_id;
$$;