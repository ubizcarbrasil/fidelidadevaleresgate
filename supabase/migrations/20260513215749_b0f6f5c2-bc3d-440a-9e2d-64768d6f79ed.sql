-- =========================================================================
-- FASE B-CLEANUP — Chunk 2 + Chunk 3 (atomic)
-- Substitui referências internas duelo_* → campeonato_* e cria 5 RPCs
-- campeonato_* (Bloco B) com aliases duelo_* wrappers.
-- Zero alteração de lógica.
-- =========================================================================

-- -------------------------------------------------------------------------
-- BLOCO B (Chunk 3) — criar campeonato_* a partir dos duelo_* atuais
-- (criado primeiro para que campeonato_apply_promotion_relegation exista
--  antes do Chunk 2 reescrever campeonato_advance_phases)
-- -------------------------------------------------------------------------
DO $migration$
DECLARE
  v_def text;
  v_pairs text[][] := ARRAY[
    ['duelo_confirm_prize_distribution','campeonato_confirm_prize_distribution'],
    ['duelo_move_driver_to_tier','campeonato_move_driver_to_tier'],
    ['duelo_remove_driver_from_season','campeonato_remove_driver_from_season'],
    ['duelo_mover_motoristas_em_lote','campeonato_mover_motoristas_em_lote'],
    ['duelo_apply_promotion_relegation','campeonato_apply_promotion_relegation']
  ];
  v_old text; v_new text;
BEGIN
  FOR i IN 1..array_length(v_pairs,1) LOOP
    v_old := v_pairs[i][1];
    v_new := v_pairs[i][2];

    SELECT pg_get_functiondef(p.oid) INTO v_def
      FROM pg_proc p
     WHERE p.pronamespace='public'::regnamespace
       AND p.proname = v_old
     LIMIT 1;

    -- Renomeia o cabeçalho da função
    v_def := replace(v_def, 'FUNCTION public.'||v_old||'(', 'FUNCTION public.'||v_new||'(');

    -- Substitui referências internas a helpers duelo_* (zero alteração de lógica)
    v_def := replace(v_def, 'duelo_admin_can_manage', 'campeonato_admin_can_manage');
    v_def := replace(v_def, 'duelo_is_weekend_at', 'campeonato_is_weekend_at');
    v_def := replace(v_def, 'duelo_seed_initial_tier_memberships', 'campeonato_seed_initial_tier_memberships');
    v_def := replace(v_def, 'duelo_create_brackets_within_tier', 'campeonato_create_brackets_within_tier');
    v_def := replace(v_def, 'duelo_get_engagement_format', 'campeonato_get_engagement_format');
    v_def := replace(v_def, 'duelo_apply_promotion_relegation', 'campeonato_apply_promotion_relegation');
    v_def := replace(v_def, '_duelo_log_attempt', '_campeonato_log_attempt');

    EXECUTE v_def;
  END LOOP;
END
$migration$;

-- Grants idênticos para as novas campeonato_*
GRANT EXECUTE ON FUNCTION public.campeonato_confirm_prize_distribution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campeonato_apply_promotion_relegation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campeonato_move_driver_to_tier(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campeonato_remove_driver_from_season(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campeonato_mover_motoristas_em_lote(uuid, uuid[], uuid) TO authenticated;

-- -------------------------------------------------------------------------
-- CHUNK 2 — reescrever 10 RPCs trocando helpers duelo_* → campeonato_*
-- -------------------------------------------------------------------------
DO $migration$
DECLARE
  v_def text; v_name text;
  v_names text[] := ARRAY[
    'campeonato_advance_phases',
    'campeonato_backfill_standings',
    'campeonato_cancel_season',
    'campeonato_pause_season',
    'campeonato_resume_season',
    'campeonato_update_prize',
    'campeonato_reconcile_standings',
    'campeonato_materialize_and_seed_season',
    'campeonato_guard_tier_membership_insert',
    'duelo_update_standings_from_ride'
  ];
BEGIN
  FOREACH v_name IN ARRAY v_names LOOP
    SELECT pg_get_functiondef(p.oid) INTO v_def
      FROM pg_proc p
     WHERE p.pronamespace='public'::regnamespace
       AND p.proname = v_name
     LIMIT 1;

    v_def := replace(v_def, 'duelo_admin_can_manage', 'campeonato_admin_can_manage');
    v_def := replace(v_def, 'duelo_is_weekend_at', 'campeonato_is_weekend_at');
    v_def := replace(v_def, 'duelo_seed_initial_tier_memberships', 'campeonato_seed_initial_tier_memberships');
    v_def := replace(v_def, 'duelo_create_brackets_within_tier', 'campeonato_create_brackets_within_tier');
    v_def := replace(v_def, 'duelo_get_engagement_format', 'campeonato_get_engagement_format');
    v_def := replace(v_def, 'duelo_apply_promotion_relegation', 'campeonato_apply_promotion_relegation');
    v_def := replace(v_def, '_duelo_log_attempt', '_campeonato_log_attempt');

    EXECUTE v_def;
  END LOOP;
END
$migration$;

-- -------------------------------------------------------------------------
-- BLOCO B (Chunk 3 parte 2) — substituir as 5 duelo_* por aliases wrappers
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.duelo_confirm_prize_distribution(p_season_id uuid)
RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.campeonato_confirm_prize_distribution(p_season_id); $$;

CREATE OR REPLACE FUNCTION public.duelo_apply_promotion_relegation(p_season_id uuid)
RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.campeonato_apply_promotion_relegation(p_season_id); $$;

CREATE OR REPLACE FUNCTION public.duelo_move_driver_to_tier(
  p_season_id uuid, p_driver_id uuid, p_target_tier_id uuid, p_reason text DEFAULT NULL::text
) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.campeonato_move_driver_to_tier(p_season_id, p_driver_id, p_target_tier_id, p_reason); $$;

CREATE OR REPLACE FUNCTION public.duelo_remove_driver_from_season(
  p_season_id uuid, p_driver_id uuid, p_reason text DEFAULT NULL::text
) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.campeonato_remove_driver_from_season(p_season_id, p_driver_id, p_reason); $$;

CREATE OR REPLACE FUNCTION public.duelo_mover_motoristas_em_lote(
  p_season_id uuid, p_driver_ids uuid[], p_target_tier_id uuid
) RETURNS jsonb LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.campeonato_mover_motoristas_em_lote(p_season_id, p_driver_ids, p_target_tier_id); $$;

GRANT EXECUTE ON FUNCTION public.duelo_confirm_prize_distribution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_apply_promotion_relegation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_move_driver_to_tier(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_remove_driver_from_season(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duelo_mover_motoristas_em_lote(uuid, uuid[], uuid) TO authenticated;