-- 1. Tabela de auditoria
CREATE TABLE public.duelo_classificacao_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  attempted_by uuid,
  outcome text NOT NULL CHECK (outcome IN ('success','blocked')),
  block_reason text,
  block_code text,
  eligible_count int,
  required_count int,
  divergent_count int,
  divergent_sample jsonb,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_duelo_audit_season ON public.duelo_classificacao_auditoria (season_id, created_at DESC);
CREATE INDEX idx_duelo_audit_brand_branch ON public.duelo_classificacao_auditoria (brand_id, branch_id, created_at DESC);

ALTER TABLE public.duelo_classificacao_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duelo_audit_select_scope" ON public.duelo_classificacao_auditoria
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'root_admin')
  OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
  OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
);

CREATE POLICY "duelo_audit_root_write" ON public.duelo_classificacao_auditoria
TO authenticated
USING (has_role(auth.uid(),'root_admin'))
WITH CHECK (has_role(auth.uid(),'root_admin'));

-- 2. Função auxiliar de log (chamada pela RPC principal)
CREATE OR REPLACE FUNCTION public._duelo_log_attempt(
  p_season_id uuid,
  p_brand_id uuid,
  p_branch_id uuid,
  p_actor uuid,
  p_outcome text,
  p_reason text,
  p_code text,
  p_eligible_count int,
  p_required_count int,
  p_divergent_count int,
  p_divergent_sample jsonb,
  p_details jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.duelo_classificacao_auditoria (
    season_id, brand_id, branch_id, attempted_by,
    outcome, block_reason, block_code,
    eligible_count, required_count, divergent_count, divergent_sample,
    details_json
  ) VALUES (
    p_season_id, p_brand_id, p_branch_id, p_actor,
    p_outcome, p_reason, p_code,
    p_eligible_count, p_required_count, p_divergent_count, p_divergent_sample,
    COALESCE(p_details, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public._duelo_log_attempt(uuid,uuid,uuid,uuid,text,text,text,int,int,int,jsonb,jsonb) FROM public;

-- 3. RPC instrumentada
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
  v_min_points constant int := 1;
  v_min_qualified constant int := 16;
  v_eligible_count int := 0;
  v_divergent_count int := 0;
  v_divergent_sample jsonb := '[]'::jsonb;
  v_actor uuid;
BEGIN
  v_actor := auth.uid();

  SELECT * INTO v_season FROM public.duelo_seasons WHERE id = p_season_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporada não encontrada';
  END IF;

  IF NOT (
    has_role(auth.uid(), 'root_admin')
    OR (v_season.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(), 'brand_admin'))
    OR (v_season.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(), 'branch_admin'))
  ) THEN
    PERFORM public._duelo_log_attempt(
      p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
      'blocked', 'Sem permissão para encerrar esta temporada', 'unauthorized',
      v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample, '{}'::jsonb
    );
    RAISE EXCEPTION 'Sem permissão para encerrar esta temporada';
  END IF;

  IF v_season.phase <> 'classification' THEN
    PERFORM public._duelo_log_attempt(
      p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
      'blocked',
      format('Temporada não está em classificação (fase atual: %s)', v_season.phase),
      'invalid_phase',
      v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample,
      jsonb_build_object('current_phase', v_season.phase)
    );
    RAISE EXCEPTION 'Temporada não está em classificação (fase atual: %)', v_season.phase;
  END IF;

  SELECT count(*) INTO v_bracket_existing FROM public.duelo_brackets WHERE season_id = p_season_id;
  IF v_bracket_existing > 0 THEN
    PERFORM public._duelo_log_attempt(
      p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
      'blocked', 'Chaveamento já existente para esta temporada', 'bracket_exists',
      v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample,
      jsonb_build_object('existing_brackets', v_bracket_existing)
    );
    RAISE EXCEPTION 'Chaveamento já existente para esta temporada';
  END IF;

  SELECT count(*) INTO v_eligible_count
  FROM public.duelo_season_standings
  WHERE season_id = p_season_id AND points >= v_min_points;

  IF v_eligible_count < v_min_qualified THEN
    PERFORM public._duelo_log_attempt(
      p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
      'blocked',
      format('Motoristas insuficientes com pontuação mínima de %s corrida(s): encontrados %s, necessários %s.',
        v_min_points, v_eligible_count, v_min_qualified),
      'insufficient_eligible',
      v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample,
      jsonb_build_object('min_points', v_min_points)
    );
    RAISE EXCEPTION
      'Motoristas insuficientes com pontuação mínima de % corrida(s): encontrados %, necessários %.',
      v_min_points, v_eligible_count, v_min_qualified;
  END IF;

  WITH eventos_por_motorista AS (
    SELECT e.driver_id, count(*)::int AS qtd
    FROM public.duelo_match_events e
    JOIN public.duelo_brackets b ON b.id = e.bracket_id
    WHERE b.season_id = p_season_id AND e.event_type = 'ride_completed'
    GROUP BY e.driver_id
  ),
  divergentes AS (
    SELECT s.driver_id, s.points, COALESCE(ev.qtd, 0) AS eventos
    FROM public.duelo_season_standings s
    LEFT JOIN eventos_por_motorista ev ON ev.driver_id = s.driver_id
    WHERE s.season_id = p_season_id AND s.points <> COALESCE(ev.qtd, 0)
  ),
  amostra AS (
    SELECT * FROM divergentes ORDER BY driver_id LIMIT 5
  )
  SELECT
    (SELECT count(*) FROM divergentes),
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'driver_id', driver_id,
        'standings', points,
        'eventos', eventos
      )) FROM amostra),
      '[]'::jsonb
    )
  INTO v_divergent_count, v_divergent_sample;

  IF v_divergent_count > 0 THEN
    PERFORM public._duelo_log_attempt(
      p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
      'blocked',
      format('Pontos divergentes entre classificação e eventos para %s motorista(s).', v_divergent_count),
      'divergent_points',
      v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample, '{}'::jsonb
    );
    RAISE EXCEPTION
      'Pontos divergentes entre classificação e eventos para % motorista(s).', v_divergent_count;
  END IF;

  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (ORDER BY points DESC, five_star_count DESC, last_ride_at ASC NULLS LAST) AS pos
    FROM public.duelo_season_standings WHERE season_id = p_season_id
  )
  UPDATE public.duelo_season_standings s
  SET position = r.pos, qualified = (r.pos <= 16)
  FROM ranked r WHERE s.id = r.id;

  SELECT count(*) INTO v_qualified_count
  FROM public.duelo_season_standings
  WHERE season_id = p_season_id AND qualified = true;

  IF v_qualified_count < 2 THEN
    PERFORM public._duelo_log_attempt(
      p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
      'blocked',
      format('Motoristas qualificados insuficientes (mínimo 2, encontrados: %s)', v_qualified_count),
      'insufficient_qualified',
      v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample,
      jsonb_build_object('qualified', v_qualified_count)
    );
    RAISE EXCEPTION 'Motoristas qualificados insuficientes (mínimo 2, encontrados: %)', v_qualified_count;
  END IF;

  FOR v_slot IN 1..8 LOOP
    SELECT
      CASE v_slot WHEN 1 THEN 1 WHEN 2 THEN 8 WHEN 3 THEN 5 WHEN 4 THEN 4
                  WHEN 5 THEN 3 WHEN 6 THEN 6 WHEN 7 THEN 7 WHEN 8 THEN 2 END,
      CASE v_slot WHEN 1 THEN 16 WHEN 2 THEN 9 WHEN 3 THEN 12 WHEN 4 THEN 13
                  WHEN 5 THEN 14 WHEN 6 THEN 11 WHEN 7 THEN 10 WHEN 8 THEN 15 END
    INTO v_seed_a, v_seed_b;

    SELECT driver_id INTO v_driver_a FROM public.duelo_season_standings
      WHERE season_id = p_season_id AND position = v_seed_a;
    SELECT driver_id INTO v_driver_b FROM public.duelo_season_standings
      WHERE season_id = p_season_id AND position = v_seed_b;

    INSERT INTO public.duelo_brackets (season_id, round, slot, driver_a_id, driver_b_id, starts_at, ends_at)
    VALUES (p_season_id, 'r16', v_slot, v_driver_a, v_driver_b,
            v_season.knockout_starts_at, v_season.knockout_ends_at);
  END LOOP;

  UPDATE public.duelo_seasons SET phase = 'knockout_r16', updated_at = now() WHERE id = p_season_id;

  PERFORM public._duelo_log_attempt(
    p_season_id, v_season.brand_id, v_season.branch_id, v_actor,
    'success', NULL, NULL,
    v_eligible_count, v_min_qualified, v_divergent_count, v_divergent_sample,
    jsonb_build_object('qualified_count', v_qualified_count, 'brackets_created', 8, 'phase', 'knockout_r16')
  );

  RETURN jsonb_build_object(
    'success', true,
    'eligible_count', v_eligible_count,
    'qualified_count', v_qualified_count,
    'brackets_created', 8,
    'phase', 'knockout_r16'
  );
END;
$$;