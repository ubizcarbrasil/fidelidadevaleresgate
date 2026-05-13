-- =========================================================================
-- FASE B — Commit 4 (PENDENTE)
-- Remover wrappers de compatibilidade duelo_* → campeonato_*
--
-- ATENÇÃO: NÃO APLICAR antes de:
--   [ ] Migration Fase B aplicada em produção
--   [ ] Frontend (campeonato_*) deployado
--   [ ] Edge functions atualizadas e deployadas
--   [ ] 48h de observação contínua sem 42883 (function does not exist) nos logs
-- =========================================================================

-- BEGIN;

-- DROP FUNCTION IF EXISTS public.duelo_add_driver_to_season(uuid, uuid, uuid, integer, text);
-- DROP FUNCTION IF EXISTS public.duelo_advance_phases();
-- DROP FUNCTION IF EXISTS public.duelo_backfill_standings(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_calculate_prizes(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_cancel_prize(uuid, text);
-- DROP FUNCTION IF EXISTS public.duelo_cancel_season(uuid, text);
-- DROP FUNCTION IF EXISTS public.duelo_change_engagement_format(uuid, text);
-- DROP FUNCTION IF EXISTS public.duelo_get_engagement_format(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_materialize_and_seed_season(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.duelo_pause_season(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_reconcile_standings(integer);
-- DROP FUNCTION IF EXISTS public.duelo_resume_season(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_update_prize(uuid, text, text, integer);

-- Bloco B (Fase B-Cleanup) — aliases adicionados em 2026-05-13:
-- DROP FUNCTION IF EXISTS public.duelo_confirm_prize_distribution(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_apply_promotion_relegation(uuid);
-- DROP FUNCTION IF EXISTS public.duelo_move_driver_to_tier(uuid, uuid, uuid, text);
-- DROP FUNCTION IF EXISTS public.duelo_remove_driver_from_season(uuid, uuid, text);
-- DROP FUNCTION IF EXISTS public.duelo_mover_motoristas_em_lote(uuid, uuid[], uuid);

-- COMMIT;
