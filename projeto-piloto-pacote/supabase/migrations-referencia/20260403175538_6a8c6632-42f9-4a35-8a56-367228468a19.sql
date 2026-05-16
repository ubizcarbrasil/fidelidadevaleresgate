CREATE OR REPLACE FUNCTION public.get_branch_points_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(driver_name, 'Motorista') AS participant_name,
    'driver'::text AS participant_type,
    SUM(driver_points_credited)::bigint AS total_points
  FROM machine_rides
  WHERE ride_status = 'FINALIZED'
    AND branch_id = p_branch_id
    AND driver_points_credited > 0
    AND driver_name IS NOT NULL
  GROUP BY driver_name
  ORDER BY total_points DESC
  LIMIT p_limit;
$$;