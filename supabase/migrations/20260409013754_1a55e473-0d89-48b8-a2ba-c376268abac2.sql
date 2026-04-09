
CREATE OR REPLACE FUNCTION public.get_side_bet_ranking(p_branch_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  rank_position bigint,
  customer_id uuid,
  bettor_name text,
  total_bets bigint,
  bets_won bigint,
  bets_lost bigint,
  win_rate numeric,
  points_won bigint,
  points_lost bigint,
  net_points bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH all_bettors AS (
    -- Bettor A side
    SELECT
      sb.bettor_a_customer_id AS cid,
      1 AS bet_count,
      CASE WHEN sb.winner_customer_id = sb.bettor_a_customer_id THEN 1 ELSE 0 END AS won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_a_customer_id THEN 1 ELSE 0 END AS lost,
      CASE WHEN sb.winner_customer_id = sb.bettor_a_customer_id
        THEN COALESCE(sb.bettor_b_points, 0)
        ELSE 0
      END AS pts_won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_a_customer_id
        THEN sb.bettor_a_points
        ELSE 0
      END AS pts_lost
    FROM duel_side_bets sb
    WHERE sb.branch_id = p_branch_id
      AND sb.status = 'settled'
      AND sb.bettor_a_customer_id IS NOT NULL

    UNION ALL

    -- Bettor B side
    SELECT
      sb.bettor_b_customer_id AS cid,
      1 AS bet_count,
      CASE WHEN sb.winner_customer_id = sb.bettor_b_customer_id THEN 1 ELSE 0 END AS won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_b_customer_id THEN 1 ELSE 0 END AS lost,
      CASE WHEN sb.winner_customer_id = sb.bettor_b_customer_id
        THEN sb.bettor_a_points
        ELSE 0
      END AS pts_won,
      CASE WHEN sb.winner_customer_id IS NOT NULL AND sb.winner_customer_id != sb.bettor_b_customer_id
        THEN COALESCE(sb.bettor_b_points, 0)
        ELSE 0
      END AS pts_lost
    FROM duel_side_bets sb
    WHERE sb.branch_id = p_branch_id
      AND sb.status = 'settled'
      AND sb.bettor_b_customer_id IS NOT NULL
  ),
  aggregated AS (
    SELECT
      ab.cid,
      SUM(ab.bet_count)::bigint AS total_bets,
      SUM(ab.won)::bigint AS bets_won,
      SUM(ab.lost)::bigint AS bets_lost,
      CASE WHEN SUM(ab.bet_count) > 0
        THEN ROUND(SUM(ab.won)::numeric / SUM(ab.bet_count) * 100, 1)
        ELSE 0
      END AS win_rate,
      SUM(ab.pts_won)::bigint AS points_won,
      SUM(ab.pts_lost)::bigint AS points_lost,
      (SUM(ab.pts_won) - SUM(ab.pts_lost))::bigint AS net_points
    FROM all_bettors ab
    GROUP BY ab.cid
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.net_points DESC, a.win_rate DESC)::bigint AS rank_position,
    a.cid AS customer_id,
    COALESCE(ddp.public_nickname, TRIM(REGEXP_REPLACE(c.name, '\[MOTORISTA\]\s*', '', 'gi')), 'Apostador')::text AS bettor_name,
    a.total_bets,
    a.bets_won,
    a.bets_lost,
    a.win_rate,
    a.points_won,
    a.points_lost,
    a.net_points
  FROM aggregated a
  JOIN customers c ON c.id = a.cid
  LEFT JOIN driver_duel_participants ddp ON ddp.customer_id = a.cid
  ORDER BY a.net_points DESC, a.win_rate DESC
  LIMIT p_limit;
$$;
