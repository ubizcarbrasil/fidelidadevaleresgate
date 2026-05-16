CREATE OR REPLACE FUNCTION public.driver_get_bracket_v2(
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
  v_season_info jsonb;
  v_brackets jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id
    FROM public.duelo_seasons s
   WHERE s.id = p_season_id;

  IF v_brand_id IS NULL OR NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN jsonb_build_object('season_info', NULL, 'brackets', '[]'::jsonb);
  END IF;

  SELECT jsonb_build_object(
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'phase_config', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('phase', pc.phase, 'duration_hours', pc.duration_hours)
        ORDER BY CASE pc.phase
          WHEN 'R16' THEN 1
          WHEN 'QF' THEN 2
          WHEN 'SF' THEN 3
          WHEN 'Final' THEN 4
          ELSE 5
        END
      )
      FROM public.duelo_season_phase_config pc
      WHERE pc.season_id = p_season_id
    ), '[]'::jsonb)
  )
  INTO v_season_info
  FROM public.duelo_seasons s
  WHERE s.id = p_season_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'phase', b.round,
      'bracket_position', b.slot,
      'driver_a_id', b.driver_a_id,
      'driver_a_name', ca.name,
      'driver_a_photo_url', COALESCE(ca.photo_url, dpa.photo_url),
      'driver_b_id', b.driver_b_id,
      'driver_b_name', cb.name,
      'driver_b_photo_url', COALESCE(cb.photo_url, dpb.photo_url),
      'driver_a_rides', b.driver_a_rides,
      'driver_b_rides', b.driver_b_rides,
      'winner_id', b.winner_id,
      'starts_at', b.starts_at,
      'ends_at', b.ends_at,
      'is_my_match', (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
    )
    ORDER BY
      CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END,
      b.slot
  ), '[]'::jsonb)
  INTO v_brackets
  FROM public.duelo_brackets b
  LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
  LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
  LEFT JOIN public.driver_profiles dpa ON dpa.customer_id = b.driver_a_id
  LEFT JOIN public.driver_profiles dpb ON dpb.customer_id = b.driver_b_id
  WHERE b.season_id = p_season_id
    AND b.tier_id = p_tier_id;

  RETURN jsonb_build_object('season_info', v_season_info, 'brackets', v_brackets);
END;
$$;

REVOKE ALL ON FUNCTION public.driver_get_bracket_v2(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_get_bracket_v2(uuid, uuid, uuid) TO authenticated;