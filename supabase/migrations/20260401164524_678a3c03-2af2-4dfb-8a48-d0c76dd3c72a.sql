
-- Add macaneta_points_per_ride column
ALTER TABLE public.driver_points_rules
ADD COLUMN IF NOT EXISTS macaneta_points_per_ride integer NOT NULL DEFAULT 0;

-- Update get_points_ranking to exclude 'Maçaneta' from passenger ranking
CREATE OR REPLACE FUNCTION public.get_points_ranking(p_brand_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(participant_name text, participant_type text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Ranking de passageiros (exclui Maçaneta)
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
      AND LOWER(passenger_name) != 'maçaneta'
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
$function$;
