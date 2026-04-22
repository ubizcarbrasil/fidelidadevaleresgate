-- ============================================================
-- C.3 PARTE A: engagement_format + motor condicional + troca
-- ============================================================

-- A.1) Schema
ALTER TABLE public.brand_business_models
  ADD COLUMN IF NOT EXISTS engagement_format text NOT NULL DEFAULT 'duelo'
  CHECK (engagement_format IN ('duelo','mass_duel','campeonato'));

CREATE INDEX IF NOT EXISTS idx_bbm_brand_format
  ON public.brand_business_models(brand_id, engagement_format);

-- Helper: formato ativo do duelo_motorista por brand
CREATE OR REPLACE FUNCTION public.duelo_get_engagement_format(p_brand_id uuid)
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT bbm.engagement_format
       FROM public.brand_business_models bbm
       JOIN public.business_models bm ON bm.id = bbm.business_model_id
      WHERE bbm.brand_id = p_brand_id
        AND bm.key = 'duelo_motorista'
        AND bbm.is_enabled = true
      LIMIT 1),
    'duelo'
  );
$$;

-- A.2) Atualizar trigger duelo_update_standings_from_ride com filtro de formato
CREATE OR REPLACE FUNCTION public.duelo_update_standings_from_ride()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_tier_id uuid;
  v_finalized_at timestamptz;
  v_is_weekend boolean;
  v_brand_id uuid;
BEGIN
  IF NEW.ride_status <> 'FINALIZED' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN RETURN NEW; END IF;
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;

  -- Filtro de formato: só processa se brand está em 'campeonato'
  SELECT brand_id INTO v_brand_id FROM public.branches WHERE id = NEW.branch_id;
  IF public.duelo_get_engagement_format(v_brand_id) <> 'campeonato' THEN
    RETURN NEW;
  END IF;

  v_finalized_at := COALESCE(NEW.finalized_at, now());
  v_is_weekend := public.duelo_is_weekend_at(v_finalized_at, NEW.branch_id);

  SELECT s.id INTO v_season_id
    FROM public.duelo_seasons s
   WHERE s.branch_id = NEW.branch_id
     AND s.phase = 'classification'
     AND v_finalized_at >= s.classification_starts_at
     AND v_finalized_at <  s.classification_ends_at
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_season_id IS NULL THEN RETURN NEW; END IF;

  SELECT tm.tier_id INTO v_tier_id
    FROM public.duelo_tier_memberships tm
   WHERE tm.season_id = v_season_id AND tm.driver_id = NEW.driver_customer_id
   LIMIT 1;
  IF v_tier_id IS NULL THEN
    INSERT INTO public.duelo_attempts_log(code, season_id, driver_id, payload)
      VALUES ('no_membership', v_season_id, NEW.driver_customer_id, jsonb_build_object('ride_id', NEW.id));
    RETURN NEW;
  END IF;

  INSERT INTO public.duelo_season_standings(
    season_id, driver_id, tier_id, points, weekend_rides_count, last_ride_at, qualified, relegated_auto)
  VALUES (
    v_season_id, NEW.driver_customer_id, v_tier_id, 1,
    CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
    v_finalized_at, false, false)
  ON CONFLICT (season_id, driver_id) DO UPDATE
     SET points = public.duelo_season_standings.points + 1,
         weekend_rides_count = public.duelo_season_standings.weekend_rides_count
                             + CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
         last_ride_at = GREATEST(
           COALESCE(public.duelo_season_standings.last_ride_at, EXCLUDED.last_ride_at),
           EXCLUDED.last_ride_at),
         tier_id = COALESCE(public.duelo_season_standings.tier_id, EXCLUDED.tier_id);
  RETURN NEW;
END;
$$;

-- A.2.b) Atualizar duelo_reconcile_standings com filtro de formato
CREATE OR REPLACE FUNCTION public.duelo_reconcile_standings(p_hours int DEFAULT 48)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rec record; v_expected int; v_expected_last timestamptz; v_expected_weekend int;
  v_checked int := 0; v_fixed int := 0;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT st.season_id, st.driver_id, s.brand_id, s.branch_id,
           s.classification_starts_at, s.classification_ends_at
      FROM public.duelo_season_standings st
      JOIN public.duelo_seasons s ON s.id = st.season_id
     WHERE s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
       AND public.duelo_get_engagement_format(s.brand_id) = 'campeonato'
       AND EXISTS (SELECT 1 FROM public.machine_rides mr
                    WHERE mr.driver_customer_id = st.driver_id
                      AND mr.branch_id = s.branch_id
                      AND mr.ride_status = 'FINALIZED'
                      AND mr.finalized_at >= now() - (p_hours||' hours')::interval)
  LOOP
    v_checked := v_checked + 1;
    SELECT COUNT(*)::int,
           MAX(mr.finalized_at),
           COALESCE(SUM(CASE WHEN public.duelo_is_weekend_at(mr.finalized_at, mr.branch_id) THEN 1 ELSE 0 END), 0)::int
      INTO v_expected, v_expected_last, v_expected_weekend
      FROM public.machine_rides mr
     WHERE mr.driver_customer_id = v_rec.driver_id
       AND mr.branch_id = v_rec.branch_id
       AND mr.ride_status = 'FINALIZED'
       AND mr.finalized_at >= v_rec.classification_starts_at
       AND mr.finalized_at <  v_rec.classification_ends_at;
    UPDATE public.duelo_season_standings st
       SET points = v_expected,
           weekend_rides_count = v_expected_weekend,
           last_ride_at = v_expected_last
     WHERE st.season_id = v_rec.season_id AND st.driver_id = v_rec.driver_id
       AND (st.points <> v_expected
         OR st.weekend_rides_count <> v_expected_weekend
         OR st.last_ride_at IS DISTINCT FROM v_expected_last);
    IF FOUND THEN v_fixed := v_fixed + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('checked', v_checked, 'fixed', v_fixed, 'window_hours', p_hours);
END; $$;

-- A.3) RPC de troca de formato
CREATE OR REPLACE FUNCTION public.duelo_change_engagement_format(
  p_brand_id uuid, p_new_format text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_previous text; v_count int;
BEGIN
  IF p_new_format NOT IN ('duelo','mass_duel','campeonato') THEN
    RAISE EXCEPTION 'Formato inválido: %', p_new_format;
  END IF;
  IF NOT (has_role(auth.uid(),'root_admin')
       OR (p_brand_id = ANY(get_user_brand_ids(auth.uid()))
           AND has_role(auth.uid(),'brand_admin'))) THEN
    RAISE EXCEPTION 'Sem autorização para alterar formato';
  END IF;
  SELECT COUNT(*) INTO v_count FROM public.duelo_seasons
   WHERE brand_id = p_brand_id AND phase <> 'finished';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Não é possível trocar formato com temporada ativa. Aguarde finalização ou cancele a temporada.';
  END IF;
  SELECT bbm.engagement_format INTO v_previous
    FROM public.brand_business_models bbm
    JOIN public.business_models bm ON bm.id = bbm.business_model_id
   WHERE bbm.brand_id = p_brand_id AND bm.key = 'duelo_motorista' LIMIT 1;
  UPDATE public.brand_business_models bbm
     SET engagement_format = p_new_format, updated_at = now()
    FROM public.business_models bm
   WHERE bbm.business_model_id = bm.id
     AND bm.key = 'duelo_motorista'
     AND bbm.brand_id = p_brand_id;
  INSERT INTO public.duelo_attempts_log(code, payload)
    VALUES ('format_changed', jsonb_build_object(
      'brand_id', p_brand_id, 'previous_format', v_previous,
      'new_format', p_new_format, 'changed_by', auth.uid()));
  RETURN jsonb_build_object('previous_format', v_previous,
    'new_format', p_new_format, 'changed_at', now());
END; $$;

-- ============================================================
-- C.3 PARTE B: 6 RPCs de leitura do Motorista
-- ============================================================

-- Helper interno: valida que motorista pertence à marca
CREATE OR REPLACE FUNCTION public.driver_belongs_to_brand(p_driver_id uuid, p_brand_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.customers
                  WHERE id = p_driver_id AND brand_id = p_brand_id);
$$;

-- B.1) Temporada ativa do motorista
CREATE OR REPLACE FUNCTION public.driver_get_active_season(
  p_brand_id uuid, p_driver_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.driver_belongs_to_brand(p_driver_id, p_brand_id) THEN
    RETURN NULL;
  END IF;
  SELECT jsonb_build_object(
    'season_id', s.id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'phase', s.phase,
    'classification_starts_at', s.classification_starts_at,
    'classification_ends_at', s.classification_ends_at,
    'knockout_starts_at', s.knockout_starts_at,
    'knockout_ends_at', s.knockout_ends_at,
    'tier_id', tm.tier_id,
    'tier_name', t.name,
    'tier_order', t.tier_order,
    'driver_points', st.points,
    'driver_weekend_rides', st.weekend_rides_count,
    'driver_position', st.position_in_tier,
    'driver_qualified', st.qualified,
    'driver_relegated_auto', st.relegated_auto
  ) INTO v_result
    FROM public.duelo_seasons s
    JOIN public.duelo_tier_memberships tm
      ON tm.season_id = s.id AND tm.driver_id = p_driver_id
    JOIN public.duelo_season_tiers t ON t.id = tm.tier_id
    LEFT JOIN public.duelo_season_standings st
      ON st.season_id = s.id AND st.driver_id = p_driver_id
   WHERE s.brand_id = p_brand_id
     AND s.phase <> 'finished'
   ORDER BY s.created_at DESC
   LIMIT 1;
  RETURN v_result;
END; $$;

-- B.2) Ranking centrado (±range posições do motorista)
CREATE OR REPLACE FUNCTION public.driver_get_centered_ranking(
  p_season_id uuid, p_driver_id uuid, p_range int DEFAULT 2
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_brand_id uuid;
  v_tier_id uuid;
  v_result jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.duelo_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT tier_id INTO v_tier_id FROM public.duelo_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id LIMIT 1;
  IF v_tier_id IS NULL THEN RETURN '[]'::jsonb; END IF;

  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                  COALESCE(st.last_ride_at, 'infinity'::timestamptz) ASC) AS rn,
      st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at,
      c.name AS driver_name
      FROM public.duelo_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = v_tier_id
  ),
  me AS (SELECT rn FROM ranked WHERE driver_id = p_driver_id)
  SELECT jsonb_agg(jsonb_build_object(
    'position', r.rn,
    'driver_id', r.driver_id,
    'driver_name', r.driver_name,
    'points', r.points,
    'weekend_rides_count', r.weekend_rides_count,
    'last_ride_at', r.last_ride_at,
    'is_me', (r.driver_id = p_driver_id)
  ) ORDER BY r.rn) INTO v_result
    FROM ranked r, me
   WHERE r.rn BETWEEN me.rn - p_range AND me.rn + p_range;
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $$;

-- B.3) Tabela completa do tier
CREATE OR REPLACE FUNCTION public.driver_get_full_tier_table(
  p_season_id uuid, p_driver_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_brand_id uuid;
  v_tier_id uuid;
  v_result jsonb;
  v_qualified_top int := 16;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.duelo_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT tier_id INTO v_tier_id FROM public.duelo_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id LIMIT 1;
  IF v_tier_id IS NULL THEN RETURN '[]'::jsonb; END IF;

  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY st.points DESC, st.weekend_rides_count DESC,
                                  COALESCE(st.last_ride_at, 'infinity'::timestamptz) ASC) AS rn,
      st.driver_id, st.points, st.weekend_rides_count, st.last_ride_at, st.qualified,
      c.name AS driver_name
      FROM public.duelo_season_standings st
      JOIN public.customers c ON c.id = st.driver_id
     WHERE st.season_id = p_season_id AND st.tier_id = v_tier_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'position', rn,
    'driver_id', driver_id,
    'driver_name', driver_name,
    'points', points,
    'weekend_rides_count', weekend_rides_count,
    'last_ride_at', last_ride_at,
    'qualified', qualified,
    'is_me', (driver_id = p_driver_id),
    'in_top', (rn <= v_qualified_top)
  ) ORDER BY rn) INTO v_result FROM ranked;
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $$;

-- B.4) Confronto atual no mata-mata
CREATE OR REPLACE FUNCTION public.driver_get_current_match(
  p_season_id uuid, p_driver_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_brand_id uuid;
  v_phase text;
  v_round text;
  v_result jsonb;
BEGIN
  SELECT s.brand_id, s.phase INTO v_brand_id, v_phase
    FROM public.duelo_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN NULL;
  END IF;
  IF v_phase NOT IN ('knockout_r16','knockout_qf','knockout_sf','knockout_final') THEN
    RETURN NULL;
  END IF;
  v_round := CASE v_phase
    WHEN 'knockout_r16' THEN 'r16'
    WHEN 'knockout_qf' THEN 'qf'
    WHEN 'knockout_sf' THEN 'sf'
    ELSE 'final' END;

  SELECT jsonb_build_object(
    'bracket_id', b.id,
    'round', b.round,
    'slot', b.slot,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id,
    'driver_a_name', ca.name,
    'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id,
    'driver_b_name', cb.name,
    'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id,
    'is_me_a', (b.driver_a_id = p_driver_id),
    'is_me_b', (b.driver_b_id = p_driver_id),
    'eliminated', (b.winner_id IS NOT NULL AND b.winner_id <> p_driver_id)
  ) INTO v_result
    FROM public.duelo_brackets b
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id
     AND b.round = v_round
     AND (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
   LIMIT 1;
  RETURN v_result;
END; $$;

-- B.5) Chaveamento completo do tier do motorista
CREATE OR REPLACE FUNCTION public.driver_get_full_bracket(
  p_season_id uuid, p_driver_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_brand_id uuid;
  v_tier_id uuid;
  v_result jsonb;
BEGIN
  SELECT s.brand_id INTO v_brand_id FROM public.duelo_seasons s WHERE s.id = p_season_id;
  IF NOT public.driver_belongs_to_brand(p_driver_id, v_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT tier_id INTO v_tier_id FROM public.duelo_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id LIMIT 1;

  SELECT jsonb_agg(jsonb_build_object(
    'bracket_id', b.id,
    'round', b.round,
    'slot', b.slot,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'driver_a_id', b.driver_a_id,
    'driver_a_name', ca.name,
    'driver_a_rides', b.driver_a_rides,
    'driver_b_id', b.driver_b_id,
    'driver_b_name', cb.name,
    'driver_b_rides', b.driver_b_rides,
    'winner_id', b.winner_id,
    'is_me_involved', (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
  ) ORDER BY
    CASE b.round WHEN 'r16' THEN 1 WHEN 'qf' THEN 2 WHEN 'sf' THEN 3 ELSE 4 END,
    b.slot
  ) INTO v_result
    FROM public.duelo_brackets b
    LEFT JOIN public.customers ca ON ca.id = b.driver_a_id
    LEFT JOIN public.customers cb ON cb.id = b.driver_b_id
   WHERE b.season_id = p_season_id
     AND (v_tier_id IS NULL OR b.tier_id = v_tier_id);
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $$;

-- B.6) Histórico de temporadas do motorista
CREATE OR REPLACE FUNCTION public.driver_get_history(
  p_brand_id uuid, p_driver_id uuid, p_limit int DEFAULT 10
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.driver_belongs_to_brand(p_driver_id, p_brand_id) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'history_id', h.id,
    'season_id', h.season_id,
    'season_name', s.name,
    'year', s.year,
    'month', s.month,
    'starting_tier_id', h.starting_tier_id,
    'starting_tier_name', ts.name,
    'starting_tier_order', ts.tier_order,
    'ending_tier_id', h.ending_tier_id,
    'ending_tier_name', te.name,
    'ending_tier_order', te.tier_order,
    'ending_position', h.ending_position,
    'outcome', h.outcome,
    'created_at', h.created_at
  ) ORDER BY s.year DESC, s.month DESC) INTO v_result
    FROM (
      SELECT * FROM public.duelo_driver_tier_history
       WHERE brand_id = p_brand_id AND driver_id = p_driver_id
       ORDER BY created_at DESC
       LIMIT p_limit
    ) h
    JOIN public.duelo_seasons s ON s.id = h.season_id
    LEFT JOIN public.duelo_season_tiers ts ON ts.id = h.starting_tier_id
    LEFT JOIN public.duelo_season_tiers te ON te.id = h.ending_tier_id;
  RETURN COALESCE(v_result, '[]'::jsonb);
END; $$;