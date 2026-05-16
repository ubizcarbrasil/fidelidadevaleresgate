-- RPC: mover motorista entre séries (tiers) dentro de uma temporada ativa
CREATE OR REPLACE FUNCTION public.duelo_move_driver_to_tier(
  p_season_id uuid,
  p_driver_id uuid,
  p_target_tier_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_phase text;
  v_current_tier_id uuid;
  v_target_brand_id uuid;
  v_target_season_id uuid;
BEGIN
  -- Carrega temporada
  SELECT s.brand_id, s.branch_id, s.phase
    INTO v_brand_id, v_branch_id, v_phase
  FROM public.duelo_seasons s
  WHERE s.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Autorização
  IF NOT public.duelo_admin_can_manage(v_brand_id) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar esta temporada' USING ERRCODE = '42501';
  END IF;

  -- Só durante classificação
  IF v_phase IS DISTINCT FROM 'classification' THEN
    RAISE EXCEPTION 'A distribuição manual só é permitida durante a fase de classificação (fase atual: %)', v_phase
      USING ERRCODE = 'P0001';
  END IF;

  -- Valida tier alvo (mesma temporada e mesma marca)
  SELECT t.brand_id, t.season_id
    INTO v_target_brand_id, v_target_season_id
  FROM public.duelo_tiers t
  WHERE t.id = p_target_tier_id;

  IF v_target_brand_id IS NULL THEN
    RAISE EXCEPTION 'Série de destino não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_target_season_id IS DISTINCT FROM p_season_id OR v_target_brand_id IS DISTINCT FROM v_brand_id THEN
    RAISE EXCEPTION 'Série de destino não pertence à temporada informada' USING ERRCODE = 'P0001';
  END IF;

  -- Tier atual
  SELECT m.tier_id INTO v_current_tier_id
  FROM public.duelo_tier_memberships m
  WHERE m.season_id = p_season_id AND m.driver_id = p_driver_id;

  IF v_current_tier_id IS NULL THEN
    RAISE EXCEPTION 'Motorista não está nesta temporada' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_tier_id = p_target_tier_id THEN
    RETURN jsonb_build_object('moved', false, 'reason', 'already_in_tier');
  END IF;

  -- Atualiza membership
  UPDATE public.duelo_tier_memberships
     SET tier_id = p_target_tier_id,
         source = 'manual_move'
   WHERE season_id = p_season_id
     AND driver_id = p_driver_id;

  -- Atualiza standings (se existir registro)
  UPDATE public.duelo_season_standings
     SET tier_id = p_target_tier_id
   WHERE season_id = p_season_id
     AND driver_id = p_driver_id;

  -- Registra histórico
  INSERT INTO public.duelo_driver_tier_history (
    brand_id, branch_id, season_id, driver_id,
    from_tier_id, to_tier_id, outcome, reason
  ) VALUES (
    v_brand_id, v_branch_id, p_season_id, p_driver_id,
    v_current_tier_id, p_target_tier_id, 'manual_moved', p_reason
  );

  RETURN jsonb_build_object(
    'moved', true,
    'from_tier_id', v_current_tier_id,
    'to_tier_id', p_target_tier_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_move_driver_to_tier(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.duelo_move_driver_to_tier(uuid, uuid, uuid, text) TO authenticated;

-- RPC: remover motorista da temporada
CREATE OR REPLACE FUNCTION public.duelo_remove_driver_from_season(
  p_season_id uuid,
  p_driver_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_branch_id uuid;
  v_phase text;
  v_current_tier_id uuid;
  v_has_brackets boolean;
BEGIN
  SELECT s.brand_id, s.branch_id, s.phase
    INTO v_brand_id, v_branch_id, v_phase
  FROM public.duelo_seasons s
  WHERE s.id = p_season_id;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.duelo_admin_can_manage(v_brand_id) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar esta temporada' USING ERRCODE = '42501';
  END IF;

  IF v_phase IS DISTINCT FROM 'classification' THEN
    RAISE EXCEPTION 'A remoção só é permitida durante a fase de classificação (fase atual: %)', v_phase
      USING ERRCODE = 'P0001';
  END IF;

  SELECT m.tier_id INTO v_current_tier_id
  FROM public.duelo_tier_memberships m
  WHERE m.season_id = p_season_id AND m.driver_id = p_driver_id;

  IF v_current_tier_id IS NULL THEN
    RAISE EXCEPTION 'Motorista não está nesta temporada' USING ERRCODE = 'P0002';
  END IF;

  -- Bloqueia se motorista já tem partida no chaveamento desta temporada
  SELECT EXISTS (
    SELECT 1 FROM public.duelo_brackets b
    WHERE b.season_id = p_season_id
      AND (b.driver_a_id = p_driver_id OR b.driver_b_id = p_driver_id)
  ) INTO v_has_brackets;

  IF v_has_brackets THEN
    RAISE EXCEPTION 'Motorista já está em uma chave do mata-mata e não pode ser removido' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.duelo_tier_memberships
   WHERE season_id = p_season_id AND driver_id = p_driver_id;

  DELETE FROM public.duelo_season_standings
   WHERE season_id = p_season_id AND driver_id = p_driver_id;

  INSERT INTO public.duelo_driver_tier_history (
    brand_id, branch_id, season_id, driver_id,
    from_tier_id, to_tier_id, outcome, reason
  ) VALUES (
    v_brand_id, v_branch_id, p_season_id, p_driver_id,
    v_current_tier_id, NULL, 'manual_removed', p_reason
  );

  RETURN jsonb_build_object('removed', true, 'from_tier_id', v_current_tier_id);
END;
$$;

REVOKE ALL ON FUNCTION public.duelo_remove_driver_from_season(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.duelo_remove_driver_from_season(uuid, uuid, text) TO authenticated;