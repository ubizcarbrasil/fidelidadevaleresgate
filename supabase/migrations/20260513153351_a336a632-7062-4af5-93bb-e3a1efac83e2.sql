-- Conserta brand_get_campeonato_kpis: estava referenciando duelo_tiers (não existe).
-- A tabela correta é duelo_season_tiers, particionada por season_id.

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_kpis(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_manage boolean;
  v_season record;
  v_total_drivers integer := 0;
  v_tier_a integer := 0;
  v_tier_b integer := 0;
  v_tier_c integer := 0;
  v_rides_total integer := 0;
  v_points_total bigint := 0;
  v_events_24h integer := 0;
  v_now timestamptz := now();
BEGIN
  v_can_manage := public.duelo_admin_can_manage(p_brand_id);
  IF NOT v_can_manage THEN
    RAISE EXCEPTION 'Sem permissão para visualizar KPIs do campeonato desta marca';
  END IF;

  SELECT s.id, s.name, s.phase,
         s.classification_starts_at, s.classification_ends_at,
         s.knockout_starts_at, s.knockout_ends_at
    INTO v_season
    FROM public.duelo_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
     AND s.cancelled_at IS NULL
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF v_season.id IS NULL THEN
    RETURN jsonb_build_object(
      'has_active_season', false,
      'season', NULL,
      'kpis', jsonb_build_object(
        'total_drivers', 0,
        'by_tier', jsonb_build_object('A',0,'B',0,'C',0),
        'rides_in_season', 0,
        'points_distributed', 0,
        'events_last_24h', 0
      )
    );
  END IF;

  -- KPI 1: total + distribuição por série, usando duelo_season_tiers (correta)
  SELECT
    COUNT(*) FILTER (WHERE true),
    COUNT(*) FILTER (WHERE t.name = 'A'),
    COUNT(*) FILTER (WHERE t.name = 'B'),
    COUNT(*) FILTER (WHERE t.name = 'C')
  INTO v_total_drivers, v_tier_a, v_tier_b, v_tier_c
  FROM public.duelo_tier_memberships m
  JOIN public.duelo_season_tiers t
    ON t.id = m.tier_id AND t.season_id = m.season_id
  WHERE m.season_id = v_season.id;

  SELECT COUNT(*), COALESCE(SUM(driver_points_credited),0)
    INTO v_rides_total, v_points_total
    FROM public.machine_rides
   WHERE brand_id = p_brand_id
     AND finalized_at IS NOT NULL
     AND finalized_at >= v_season.classification_starts_at
     AND finalized_at <= LEAST(v_now, v_season.knockout_ends_at);

  SELECT COUNT(*)
    INTO v_events_24h
    FROM public.duelo_attempts_log
   WHERE brand_id = p_brand_id
     AND created_at >= GREATEST(v_now - interval '24 hours', v_season.classification_starts_at);

  RETURN jsonb_build_object(
    'has_active_season', true,
    'season', jsonb_build_object(
      'id', v_season.id,
      'name', v_season.name,
      'phase', v_season.phase,
      'classification_starts_at', v_season.classification_starts_at,
      'classification_ends_at', v_season.classification_ends_at,
      'knockout_starts_at', v_season.knockout_starts_at,
      'knockout_ends_at', v_season.knockout_ends_at
    ),
    'kpis', jsonb_build_object(
      'total_drivers', v_total_drivers,
      'by_tier', jsonb_build_object('A', v_tier_a, 'B', v_tier_b, 'C', v_tier_c),
      'rides_in_season', v_rides_total,
      'points_distributed', v_points_total,
      'events_last_24h', v_events_24h
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.brand_get_campeonato_kpis(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.brand_get_campeonato_kpis(uuid) TO authenticated;