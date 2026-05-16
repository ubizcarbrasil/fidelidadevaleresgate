
CREATE OR REPLACE FUNCTION public.driver_list_tier_rounds(
  p_season_id uuid,
  p_tier_id uuid,
  p_driver_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand_id FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'round', r.round,
    'starts_at', r.starts_at,
    'ends_at', r.ends_at,
    'total_matches', r.total_matches,
    'status', CASE
      WHEN NOW() < r.starts_at THEN 'aguardando'
      WHEN NOW() BETWEEN r.starts_at AND r.ends_at THEN 'em_andamento'
      ELSE 'encerrado'
    END
  ) ORDER BY r.starts_at ASC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT b.round,
           MIN(b.starts_at) AS starts_at,
           MAX(b.ends_at)   AS ends_at,
           COUNT(*)         AS total_matches
      FROM public.duelo_brackets b
     WHERE b.season_id = p_season_id
       AND (p_tier_id IS NULL OR b.tier_id = p_tier_id)
     GROUP BY b.round
  ) r;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_list_tier_rounds(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_list_tier_rounds(uuid, uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.driver_list_tier_round_matches(
  p_season_id uuid,
  p_tier_id uuid,
  p_round text,
  p_driver_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand_id FROM public.duelo_seasons WHERE id = p_season_id;
  IF v_brand_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'season_id', b.season_id,
    'tier_id', b.tier_id,
    'round', b.round,
    'slot', b.slot,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id,
    'driver_a_name', ca.name,
    'driver_a_photo_url', COALESCE(ca.photo_url, dpa.photo_url),
    'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id,
    'driver_b_name', cb.name,
    'driver_b_photo_url', COALESCE(cb.photo_url, dpb.photo_url),
    'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id,
    'is_me', (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
  ) ORDER BY b.slot ASC), '[]'::jsonb)
  INTO v_result
  FROM public.duelo_brackets b
  LEFT JOIN public.customers ca        ON ca.id = b.driver_a_id
  LEFT JOIN public.customers cb        ON cb.id = b.driver_b_id
  LEFT JOIN public.driver_profiles dpa ON dpa.customer_id = b.driver_a_id
  LEFT JOIN public.driver_profiles dpb ON dpb.customer_id = b.driver_b_id
 WHERE b.season_id = p_season_id
   AND b.round = p_round
   AND (p_tier_id IS NULL OR b.tier_id = p_tier_id);

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_list_tier_round_matches(uuid, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_list_tier_round_matches(uuid, uuid, text, uuid) TO authenticated;
