
-- Agrega contagens diárias de resgates + corridas em uma única chamada,
-- substituindo a paginação cliente que baixava ~10k linhas a cada refresh.
CREATE OR REPLACE FUNCTION public.get_dashboard_daily_counts(
  p_brand_id UUID,
  p_period_days INTEGER
)
RETURNS TABLE (
  day DATE,
  redemptions_count BIGINT,
  rides_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ := (now() - make_interval(days => p_period_days));
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT (current_date - i)::date AS day
    FROM generate_series(0, GREATEST(p_period_days - 1, 0)) AS i
  ),
  red AS (
    SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::bigint AS c
    FROM public.redemptions
    WHERE created_at >= v_start
      AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    GROUP BY 1
  ),
  rides AS (
    SELECT date_trunc('day', finalized_at)::date AS day, COUNT(*)::bigint AS c
    FROM public.machine_rides
    WHERE finalized_at >= v_start
      AND ride_status = 'FINALIZED'
      AND (p_brand_id IS NULL OR brand_id = p_brand_id)
    GROUP BY 1
  )
  SELECT
    d.day,
    COALESCE(red.c, 0) AS redemptions_count,
    COALESCE(rides.c, 0) AS rides_count
  FROM days d
  LEFT JOIN red ON red.day = d.day
  LEFT JOIN rides ON rides.day = d.day
  ORDER BY d.day ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_daily_counts(UUID, INTEGER) TO authenticated, anon;
