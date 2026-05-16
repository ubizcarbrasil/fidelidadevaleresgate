
CREATE OR REPLACE FUNCTION public.get_points_ranking(p_brand_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  participant_name text,
  participant_type text,
  total_points bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Ranking de passageiros
  (
    SELECT
      COALESCE(passenger_name, 'Passageiro') AS participant_name,
      'passenger' AS participant_type,
      SUM(points_credited)::bigint AS total_points
    FROM machine_rides
    WHERE ride_status = 'FINALIZED'
      AND brand_id = p_brand_id
      AND points_credited > 0
      AND passenger_name IS NOT NULL
    GROUP BY passenger_name
    ORDER BY total_points DESC
    LIMIT p_limit
  )
  UNION ALL
  -- Ranking de motoristas
  (
    SELECT
      COALESCE(driver_name, 'Motorista') AS participant_name,
      'driver' AS participant_type,
      SUM(driver_points_credited)::bigint AS total_points
    FROM machine_rides
    WHERE ride_status = 'FINALIZED'
      AND brand_id = p_brand_id
      AND driver_points_credited > 0
      AND driver_name IS NOT NULL
    GROUP BY driver_name
    ORDER BY total_points DESC
    LIMIT p_limit
  );
$$;
