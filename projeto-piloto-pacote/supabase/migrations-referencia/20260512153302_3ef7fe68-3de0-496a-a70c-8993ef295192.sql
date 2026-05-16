CREATE OR REPLACE FUNCTION public.driver_get_tier_standings_v2(
  p_season_id uuid,
  p_tier_id uuid,
  p_driver_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_promotion_count int;
  v_relegation_count int;
  v_result jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.duelo_seasons s WHERE s.id = p_season_id;
  IF v_brand_id IS NULL THEN RETURN '[]'::jsonb; END IF;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(promotion_count, 0), COALESCE(relegation_count, 0)
    INTO v_promotion_count, v_relegation_count
    FROM public.duelo_season_tiers
   WHERE id = p_tier_id AND season_id = p_season_id;

  WITH members AS (
    SELECT st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at
      FROM public.duelo_season_standings st
     WHERE st.season_id = p_season_id AND st.tier_id = p_tier_id
  ),
  match_agg AS (
    SELECT
      d.driver_id,
      COUNT(*) FILTER (WHERE b.driver_a_rides IS NOT NULL AND b.driver_b_rides IS NOT NULL
                         AND (b.winner_id IS NOT NULL OR b.ends_at <= now())) AS matches_played,
      COUNT(*) FILTER (WHERE b.winner_id = d.driver_id) AS wins,
      COUNT(*) FILTER (WHERE b.winner_id IS NULL
                         AND b.driver_a_rides IS NOT NULL AND b.driver_b_rides IS NOT NULL
                         AND b.driver_a_rides = b.driver_b_rides
                         AND b.ends_at <= now()) AS draws,
      COALESCE(SUM(
        CASE
          WHEN b.driver_a_rides IS NULL OR b.driver_b_rides IS NULL THEN 0
          WHEN b.driver_a_id = d.driver_id THEN b.driver_a_rides - b.driver_b_rides
          WHEN b.driver_b_id = d.driver_id THEN b.driver_b_rides - b.driver_a_rides
          ELSE 0
        END
      ) FILTER (WHERE b.winner_id IS NOT NULL OR b.ends_at <= now()), 0) AS goal_diff
    FROM members d
    LEFT JOIN public.duelo_brackets b
      ON b.season_id = p_season_id
     AND b.tier_id = p_tier_id
     AND (b.driver_a_id = d.driver_id OR b.driver_b_id = d.driver_id)
    GROUP BY d.driver_id
  ),
  joined AS (
    SELECT
      m.driver_id,
      m.points,
      m.weekend_rides_count,
      m.last_ride_at,
      c.name AS driver_name,
      COALESCE(c.photo_url, dp.photo_url) AS photo_url,
      COALESCE(ma.matches_played, 0)::int AS matches_played,
      COALESCE(ma.wins, 0)::int AS wins,
      COALESCE(ma.draws, 0)::int AS draws,
      (COALESCE(ma.matches_played, 0) - COALESCE(ma.wins, 0) - COALESCE(ma.draws, 0))::int AS losses,
      COALESCE(ma.goal_diff, 0)::int AS goal_diff
    FROM members m
    JOIN public.customers c ON c.id = m.driver_id
    LEFT JOIN public.driver_profiles dp ON dp.customer_id = m.driver_id
    LEFT JOIN match_agg ma ON ma.driver_id = m.driver_id
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY points DESC, goal_diff DESC, wins DESC,
                 weekend_rides_count DESC,
                 COALESCE(last_ride_at, 'infinity'::timestamptz) ASC
      )::int AS rank,
      *
    FROM joined
  ),
  totals AS (SELECT COUNT(*)::int AS total FROM ranked)
  SELECT jsonb_agg(jsonb_build_object(
    'rank', r.rank,
    'driver_id', r.driver_id,
    'driver_name', r.driver_name,
    'photo_url', r.photo_url,
    'points', r.points,
    'matches_played', r.matches_played,
    'wins', r.wins,
    'draws', r.draws,
    'losses', r.losses,
    'goal_diff', r.goal_diff,
    'is_me', (r.driver_id = p_driver_id),
    'zone', CASE
      WHEN v_promotion_count > 0 AND r.rank <= v_promotion_count THEN 'promotion'
      WHEN v_relegation_count > 0 AND r.rank > (t.total - v_relegation_count) THEN 'relegation'
      ELSE NULL
    END
  ) ORDER BY r.rank) INTO v_result
  FROM ranked r CROSS JOIN totals t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.driver_get_tier_standings_v2(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_get_tier_standings_v2(uuid, uuid, uuid) TO authenticated;