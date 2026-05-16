-- Atualiza RPC de encerramento da classificação com validações adicionais:
-- 1) Mínimo de motoristas com pontuação mínima (>= 1 corrida)
-- 2) Detecta divergência entre standings.points e contagem real em duelo_match_events
CREATE OR REPLACE FUNCTION public.duelo_gerar_chaveamento(p_season_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season RECORD;
  v_qualified_count int;
  v_bracket_existing int;
  v_seed_a int;
  v_seed_b int;
  v_slot int;
  v_driver_a uuid;
  v_driver_b uuid;
  v_min_points constant int := 1;          -- pontuação mínima por motorista
  v_min_qualified constant int := 16;      -- motoristas necessários acima do mínimo
  v_eligible_count int;
  v_divergent_count int;
  v_divergent_sample text;
BEGIN
  -- 1. valida temporada
  SELECT * INTO v_season FROM public.duelo_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada não encontrada';
  END IF;

  -- 2. autorização
  IF NOT (
    has_role(auth.uid(), 'root_admin')
    OR (v_season.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(), 'brand_admin'))
    OR (v_season.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(), 'branch_admin'))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para encerrar esta temporada';
  END IF;

  -- 3. estado válido
  IF v_season.phase <> 'classification' THEN
    RAISE EXCEPTION 'Temporada não está em classificação (fase atual: %)', v_season.phase;
  END IF;

  -- 4. evita duplicação
  SELECT count(*) INTO v_bracket_existing FROM public.duelo_brackets WHERE season_id = p_season_id;
  IF v_bracket_existing > 0 THEN
    RAISE EXCEPTION 'Chaveamento já existente para esta temporada';
  END IF;

  -- 5. VALIDAÇÃO: quantidade mínima de motoristas com pontuação mínima
  SELECT count(*) INTO v_eligible_count
  FROM public.duelo_season_standings
  WHERE season_id = p_season_id
    AND points >= v_min_points;

  IF v_eligible_count < v_min_qualified THEN
    RAISE EXCEPTION
      'Motoristas insuficientes com pontuação mínima de % corrida(s): encontrados %, necessários %.',
      v_min_points, v_eligible_count, v_min_qualified;
  END IF;

  -- 6. VALIDAÇÃO: divergência entre standings.points e contagem em duelo_match_events
  --    (eventos da temporada via JOIN em duelo_brackets; durante a classificação,
  --     standings.points reflete corridas e deve bater com a contagem de eventos
  --     do tipo 'ride_completed' associados ao motorista naquela season)
  WITH eventos_por_motorista AS (
    SELECT e.driver_id, count(*)::int AS qtd
    FROM public.duelo_match_events e
    JOIN public.duelo_brackets b ON b.id = e.bracket_id
    WHERE b.season_id = p_season_id
      AND e.event_type = 'ride_completed'
    GROUP BY e.driver_id
  ),
  divergentes AS (
    SELECT s.driver_id, s.points, COALESCE(ev.qtd, 0) AS eventos
    FROM public.duelo_season_standings s
    LEFT JOIN eventos_por_motorista ev ON ev.driver_id = s.driver_id
    WHERE s.season_id = p_season_id
      AND s.points <> COALESCE(ev.qtd, 0)
  )
  SELECT
    count(*),
    string_agg(
      driver_id::text || ' (standings=' || points || ', eventos=' || eventos || ')',
      '; '
      ORDER BY driver_id
    )
  INTO v_divergent_count, v_divergent_sample
  FROM (SELECT * FROM divergentes LIMIT 5) d;

  IF v_divergent_count > 0 THEN
    RAISE EXCEPTION
      'Pontos divergentes entre classificação e eventos para % motorista(s). Exemplos: %',
      v_divergent_count, v_divergent_sample;
  END IF;

  -- 7. ranqueia e marca top 16
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY points DESC, five_star_count DESC, last_ride_at ASC NULLS LAST
      ) AS pos
    FROM public.duelo_season_standings
    WHERE season_id = p_season_id
  )
  UPDATE public.duelo_season_standings s
  SET position = r.pos,
      qualified = (r.pos <= 16)
  FROM ranked r
  WHERE s.id = r.id;

  SELECT count(*) INTO v_qualified_count
  FROM public.duelo_season_standings
  WHERE season_id = p_season_id AND qualified = true;

  IF v_qualified_count < 2 THEN
    RAISE EXCEPTION 'Motoristas qualificados insuficientes (mínimo 2, encontrados: %)', v_qualified_count;
  END IF;

  -- 8. gera 8 slots de R16 com seeding clássico (1x16, 8x9, 5x12, 4x13, 3x14, 6x11, 7x10, 2x15)
  FOR v_slot IN 1..8 LOOP
    SELECT
      CASE v_slot
        WHEN 1 THEN 1  WHEN 2 THEN 8  WHEN 3 THEN 5  WHEN 4 THEN 4
        WHEN 5 THEN 3  WHEN 6 THEN 6  WHEN 7 THEN 7  WHEN 8 THEN 2
      END,
      CASE v_slot
        WHEN 1 THEN 16 WHEN 2 THEN 9  WHEN 3 THEN 12 WHEN 4 THEN 13
        WHEN 5 THEN 14 WHEN 6 THEN 11 WHEN 7 THEN 10 WHEN 8 THEN 15
      END
    INTO v_seed_a, v_seed_b;

    SELECT driver_id INTO v_driver_a
      FROM public.duelo_season_standings
      WHERE season_id = p_season_id AND position = v_seed_a;

    SELECT driver_id INTO v_driver_b
      FROM public.duelo_season_standings
      WHERE season_id = p_season_id AND position = v_seed_b;

    INSERT INTO public.duelo_brackets (
      season_id, round, slot, driver_a_id, driver_b_id,
      starts_at, ends_at
    ) VALUES (
      p_season_id, 'r16', v_slot, v_driver_a, v_driver_b,
      v_season.knockout_starts_at, v_season.knockout_ends_at
    );
  END LOOP;

  -- 9. avança fase
  UPDATE public.duelo_seasons
  SET phase = 'knockout_r16',
      updated_at = now()
  WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'success', true,
    'eligible_count', v_eligible_count,
    'qualified_count', v_qualified_count,
    'brackets_created', 8,
    'phase', 'knockout_r16'
  );
END;
$$;