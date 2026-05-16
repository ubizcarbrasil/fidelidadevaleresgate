-- RPC: encerra a fase de classificação, define top 16 e gera chaveamento (seed 1x16, 2x15, ...)
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
BEGIN
  -- 1. valida temporada
  SELECT * INTO v_season FROM public.duelo_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada não encontrada';
  END IF;

  -- 2. autorização: root_admin OU brand_admin da brand OU branch_admin da branch
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

  -- 5. ranqueia e marca top 16 (qualified=true, position=1..16) pelos critérios:
  --    points DESC, five_star_count DESC, last_ride_at ASC (mais cedo desempata melhor)
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

  -- 6. conta qualificados reais (pode ser <16 se não houver motoristas suficientes)
  SELECT count(*) INTO v_qualified_count
  FROM public.duelo_season_standings
  WHERE season_id = p_season_id AND qualified = true;

  IF v_qualified_count < 2 THEN
    RAISE EXCEPTION 'Motoristas qualificados insuficientes (mínimo 2, encontrados: %)', v_qualified_count;
  END IF;

  -- 7. gera 8 slots de R16 com seeding clássico:
  --    slot 1: seed 1 vs 16 | slot 2: 8 vs 9 | slot 3: 5 vs 12 | slot 4: 4 vs 13
  --    slot 5: 3 vs 14 | slot 6: 6 vs 11 | slot 7: 7 vs 10 | slot 8: 2 vs 15
  --    Esta ordem garante que seed 1 e 2 só se cruzem na final.
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

  -- 8. avança fase
  UPDATE public.duelo_seasons
  SET phase = 'knockout_r16',
      updated_at = now()
  WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'success', true,
    'qualified_count', v_qualified_count,
    'brackets_created', 8,
    'phase', 'knockout_r16'
  );
END;
$$;

-- permissão de execução
REVOKE ALL ON FUNCTION public.duelo_gerar_chaveamento(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.duelo_gerar_chaveamento(uuid) TO authenticated;