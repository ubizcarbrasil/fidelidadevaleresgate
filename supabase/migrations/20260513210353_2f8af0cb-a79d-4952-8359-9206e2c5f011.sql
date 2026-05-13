CREATE OR REPLACE FUNCTION public.brand_get_brackets_full(p_season_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'bracket_id', b.id, 'tier_id', b.tier_id, 'tier_name', t.name, 'tier_order', t.tier_order,
    'round', b.round, 'slot', b.slot,
    'starts_at', b.starts_at, 'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id, 'driver_a_name', ca.name, 'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id, 'driver_b_name', cb.name, 'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id
  ) ORDER BY t.tier_order,
    CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END, b.slot
  ) INTO v_result
    FROM public.campeonato_brackets b
    LEFT JOIN public.campeonato_season_tiers t ON t.id = b.tier_id
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$;

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_dashboard(p_brand_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_active jsonb; v_tiers jsonb; v_season_id uuid;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT s.id, jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'branch_id', s.branch_id)
  INTO v_season_id, v_active
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND s.phase NOT IN ('finished','cancelled')
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season_id IS NULL THEN
    RETURN jsonb_build_object('active_season', NULL, 'tiers', '[]'::jsonb);
  END IF;
  WITH tier_top AS (
    SELECT t.id AS tier_id, t.name AS tier_name, t.tier_order,
           t.target_size, t.promotion_count, t.relegation_count,
      (SELECT COUNT(*)::int FROM public.campeonato_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id) AS total_drivers,
      (SELECT COUNT(*)::int FROM public.campeonato_season_standings st2
         WHERE st2.season_id = v_season_id AND st2.tier_id = t.id AND st2.qualified = true) AS qualified_count,
      (SELECT jsonb_agg(jsonb_build_object(
          'driver_id', x.driver_id, 'driver_name', x.driver_name,
          'points', x.points, 'weekend_rides_count', x.weekend_rides_count
        ) ORDER BY x.rn)
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                             COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
                 st.driver_id, c.name AS driver_name, st.points, st.weekend_rides_count
            FROM public.campeonato_season_standings st
            JOIN public.customers c ON c.id = st.driver_id
           WHERE st.season_id = v_season_id AND st.tier_id = t.id
        ) x WHERE x.rn <= 3) AS top3
      FROM public.campeonato_season_tiers t WHERE t.season_id = v_season_id
     ORDER BY t.tier_order)
  SELECT jsonb_agg(jsonb_build_object(
    'tier_id', tier_id, 'tier_name', tier_name, 'tier_order', tier_order,
    'target_size', target_size, 'promotion_count', promotion_count,
    'relegation_count', relegation_count, 'total_drivers', total_drivers,
    'qualified_count', qualified_count, 'top3', COALESCE(top3,'[]'::jsonb)
  ) ORDER BY tier_order) INTO v_tiers FROM tier_top;
  RETURN jsonb_build_object('active_season', v_active, 'tiers', COALESCE(v_tiers,'[]'::jsonb));
END; $function$;

CREATE OR REPLACE FUNCTION public.brand_get_campeonato_kpis(p_brand_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_can_manage boolean; v_season record;
  v_total_drivers integer := 0; v_tier_a integer := 0; v_tier_b integer := 0; v_tier_c integer := 0;
  v_rides_total integer := 0; v_points_total bigint := 0; v_events_24h integer := 0;
  v_now timestamptz := now();
BEGIN
  v_can_manage := public.campeonato_admin_can_manage(p_brand_id);
  IF NOT v_can_manage THEN RAISE EXCEPTION 'Sem permissão para visualizar KPIs do campeonato desta marca'; END IF;
  SELECT s.id, s.name, s.phase, s.classification_starts_at, s.classification_ends_at,
         s.knockout_starts_at, s.knockout_ends_at INTO v_season
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id AND s.phase NOT IN ('finished','cancelled') AND s.cancelled_at IS NULL
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season.id IS NULL THEN
    RETURN jsonb_build_object('has_active_season', false, 'season', NULL,
      'kpis', jsonb_build_object('total_drivers',0,'by_tier',jsonb_build_object('A',0,'B',0,'C',0),
        'rides_in_season',0,'points_distributed',0,'events_last_24h',0));
  END IF;
  SELECT COUNT(*) FILTER (WHERE true), COUNT(*) FILTER (WHERE t.name = 'A'),
    COUNT(*) FILTER (WHERE t.name = 'B'), COUNT(*) FILTER (WHERE t.name = 'C')
  INTO v_total_drivers, v_tier_a, v_tier_b, v_tier_c
  FROM public.campeonato_tier_memberships m
  JOIN public.campeonato_season_tiers t ON t.id = m.tier_id AND t.season_id = m.season_id
  WHERE m.season_id = v_season.id;
  SELECT COUNT(*), COALESCE(SUM(driver_points_credited),0) INTO v_rides_total, v_points_total
    FROM public.machine_rides
   WHERE brand_id = p_brand_id AND finalized_at IS NOT NULL
     AND finalized_at >= v_season.classification_starts_at
     AND finalized_at <= LEAST(v_now, v_season.knockout_ends_at);
  SELECT COUNT(*) INTO v_events_24h FROM public.campeonato_attempts_log
   WHERE brand_id = p_brand_id
     AND created_at >= GREATEST(v_now - interval '24 hours', v_season.classification_starts_at);
  RETURN jsonb_build_object('has_active_season', true,
    'season', jsonb_build_object('id', v_season.id, 'name', v_season.name, 'phase', v_season.phase,
      'classification_starts_at', v_season.classification_starts_at,
      'classification_ends_at', v_season.classification_ends_at,
      'knockout_starts_at', v_season.knockout_starts_at, 'knockout_ends_at', v_season.knockout_ends_at),
    'kpis', jsonb_build_object('total_drivers', v_total_drivers,
      'by_tier', jsonb_build_object('A', v_tier_a, 'B', v_tier_b, 'C', v_tier_c),
      'rides_in_season', v_rides_total, 'points_distributed', v_points_total,
      'events_last_24h', v_events_24h));
END; $function$;

CREATE OR REPLACE FUNCTION public.brand_get_drivers_available(p_brand_id uuid, p_season_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object('driver_id', c.id, 'driver_name', c.name, 'cpf', c.cpf
  ) ORDER BY c.name) INTO v_result
    FROM public.customers c
   WHERE c.brand_id = p_brand_id AND '[MOTORISTA]' = ANY(COALESCE(c.tags,'{}'::text[]))
     AND NOT EXISTS (SELECT 1 FROM public.campeonato_tier_memberships tm
        WHERE tm.season_id = p_season_id AND tm.driver_id = c.id);
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$;

CREATE OR REPLACE FUNCTION public.brand_get_season_summary(p_season_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tiers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'tier_id', t.id, 'tier_name', t.name, 'tier_order', t.tier_order,
        'target_size', t.target_size, 'promotion_count', t.promotion_count,
        'relegation_count', t.relegation_count, 'aborted_at', t.aborted_at,
        'total_drivers', (SELECT COUNT(*)::int FROM public.campeonato_season_standings
                            WHERE season_id = s.id AND tier_id = t.id),
        'qualified_count', (SELECT COUNT(*)::int FROM public.campeonato_season_standings
                              WHERE season_id = s.id AND tier_id = t.id AND qualified = true)
      ) ORDER BY t.tier_order)
        FROM public.campeonato_season_tiers t WHERE t.season_id = s.id), '[]'::jsonb)
  ) INTO v_result FROM public.campeonato_seasons s WHERE s.id = p_season_id;
  RETURN v_result;
END; $function$;

CREATE OR REPLACE FUNCTION public.brand_get_seasons_list(p_brand_id uuid, p_status text DEFAULT 'all'::text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.campeonato_admin_can_manage(p_brand_id) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'season_id', s.id, 'season_name', s.name, 'year', s.year, 'month', s.month,
    'phase', s.phase, 'paused_at', s.paused_at, 'cancelled_at', s.cancelled_at,
    'cancellation_reason', s.cancellation_reason,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_ends_at', s.knockout_ends_at,
    'created_at', s.created_at, 'branch_id', s.branch_id
  ) ORDER BY s.year DESC, s.month DESC) INTO v_result
    FROM public.campeonato_seasons s
   WHERE s.brand_id = p_brand_id
     AND CASE
           WHEN p_status = 'active' THEN s.phase NOT IN ('finished','cancelled')
           WHEN p_status = 'finished' THEN s.phase = 'finished'
           WHEN p_status = 'cancelled' THEN s.phase = 'cancelled'
           ELSE TRUE
         END;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$;

CREATE OR REPLACE FUNCTION public.brand_get_series_detail(p_season_id uuid, p_tier_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_result jsonb;
BEGIN
  SELECT brand_id INTO v_brand FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL OR NOT public.campeonato_admin_can_manage(v_brand) THEN
    RAISE EXCEPTION 'Sem autorização'; END IF;
  WITH ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                       COALESCE(st.last_ride_at,'infinity'::timestamptz) ASC) AS rn,
           st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at,
           st.qualified, c.name AS driver_name
      FROM public.campeonato_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = p_tier_id)
  SELECT jsonb_agg(jsonb_build_object(
    'position', rn, 'driver_id', driver_id, 'driver_name', driver_name,
    'points', points, 'weekend_rides_count', weekend_rides_count,
    'last_ride_at', last_ride_at, 'qualified', qualified
  ) ORDER BY rn) INTO v_result FROM ranked;
  RETURN COALESCE(v_result,'[]'::jsonb);
END; $function$;

CREATE OR REPLACE FUNCTION public.campeonato_add_driver_to_season(p_season_id uuid, p_driver_id uuid, p_tier_id uuid, p_initial_points integer DEFAULT 0, p_reason text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_brand uuid; v_branch uuid; v_phase text; v_median numeric;
        v_belongs boolean; v_tier_belongs boolean;
BEGIN
  SELECT brand_id, branch_id, phase INTO v_brand, v_branch, v_phase
    FROM public.campeonato_seasons WHERE id = p_season_id;
  IF v_brand IS NULL THEN RAISE EXCEPTION 'Temporada não encontrada'; END IF;
  IF NOT public.campeonato_admin_can_manage(v_brand) THEN RAISE EXCEPTION 'Sem autorização'; END IF;
  IF v_phase IN ('finished','cancelled') THEN RAISE EXCEPTION 'Temporada não editável (fase: %)', v_phase; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)'; END IF;
  IF p_initial_points < 0 THEN RAISE EXCEPTION 'initial_points não pode ser negativo'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.campeonato_season_tiers WHERE id = p_tier_id AND season_id = p_season_id) INTO v_tier_belongs;
  IF NOT v_tier_belongs THEN RAISE EXCEPTION 'Série não pertence a esta temporada'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.customers WHERE id = p_driver_id AND brand_id = v_brand) INTO v_belongs;
  IF NOT v_belongs THEN RAISE EXCEPTION 'Motorista não pertence à marca'; END IF;
  IF EXISTS(SELECT 1 FROM public.campeonato_tier_memberships WHERE season_id = p_season_id AND driver_id = p_driver_id) THEN
    RAISE EXCEPTION 'Motorista já está nesta temporada'; END IF;
  SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY points), 0) INTO v_median
    FROM public.campeonato_season_standings WHERE season_id = p_season_id AND tier_id = p_tier_id;
  IF p_initial_points::numeric > v_median THEN
    RAISE EXCEPTION 'initial_points (%) excede mediana da série (%) — bloqueado por antifraude', p_initial_points, v_median;
  END IF;
  INSERT INTO public.campeonato_tier_memberships(season_id, driver_id, tier_id, brand_id, branch_id, source)
    VALUES (p_season_id, p_driver_id, p_tier_id, v_brand, v_branch, 'manual_add');
  INSERT INTO public.campeonato_season_standings(season_id, driver_id, tier_id, points, weekend_rides_count, qualified, relegated_auto)
    VALUES (p_season_id, p_driver_id, p_tier_id, p_initial_points, 0, false, false);
  INSERT INTO public.campeonato_attempts_log(code, season_id, driver_id, brand_id, details_json)
    VALUES ('manual_driver_added', p_season_id, p_driver_id, v_brand,
      jsonb_build_object('tier_id', p_tier_id, 'initial_points', p_initial_points,
        'median', v_median, 'reason', p_reason, 'added_by', auth.uid()));
  RETURN jsonb_build_object('membership_created', true, 'median_at_insert', v_median);
END; $function$;