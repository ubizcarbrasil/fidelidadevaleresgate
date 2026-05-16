-- cleanup: drop função legada duelo_gerar_chaveamento
-- Motivo: referencia coluna five_star_count removida na Tarefa B.
-- Substituída pelo cron duelo_advance_phases (C.2/C.4/C.5).
-- Sem dependências em banco, triggers, cron ou edge functions.
DROP FUNCTION IF EXISTS public.duelo_gerar_chaveamento(uuid);

-- Rollback: não aplicável (função quebrada em runtime, sem chamadores).