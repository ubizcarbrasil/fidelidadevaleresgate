

# Esclarecimentos antes da execução — Tarefa B

## 1. Rollback completo

Bloco de rollback completo, executável em ordem, dentro de uma única transação:

```sql
BEGIN;

-- 1) Recriar coluna antiga
ALTER TABLE public.duelo_season_standings
  ADD COLUMN IF NOT EXISTS five_star_count int NOT NULL DEFAULT 0;

-- 2) Recriar índice antigo
DROP INDEX IF EXISTS idx_duelo_standings_ranking;
CREATE INDEX idx_duelo_standings_ranking
  ON public.duelo_season_standings
     (season_id, points DESC, five_star_count DESC, last_ride_at ASC);

-- 3) Reverter trigger duelo_update_standings_from_ride
--    Restaurar versão da migration 20260421230612 (sem weekend_rides_count)
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
BEGIN
  IF NEW.ride_status <> 'FINALIZED' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.ride_status = 'FINALIZED' THEN RETURN NEW; END IF;
  IF NEW.driver_customer_id IS NULL OR NEW.branch_id IS NULL THEN RETURN NEW; END IF;

  v_finalized_at := COALESCE(NEW.finalized_at, now());

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
    season_id, driver_id, tier_id, points, last_ride_at, qualified, relegated_auto)
  VALUES (v_season_id, NEW.driver_customer_id, v_tier_id, 1, v_finalized_at, false, false)
  ON CONFLICT (season_id, driver_id) DO UPDATE
     SET points = public.duelo_season_standings.points + 1,
         last_ride_at = GREATEST(
           COALESCE(public.duelo_season_standings.last_ride_at, EXCLUDED.last_ride_at),
           EXCLUDED.last_ride_at),
         tier_id = COALESCE(public.duelo_season_standings.tier_id, EXCLUDED.tier_id);
  RETURN NEW;
END;
$$;

-- 4) Reverter duelo_reconcile_standings (sem weekend_rides_count)
--    Reaplicar versão da migration 20260421230612
CREATE OR REPLACE FUNCTION public.duelo_reconcile_standings(p_hours int DEFAULT 48)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rec record; v_expected int; v_expected_last timestamptz;
  v_checked int := 0; v_fixed int := 0;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT st.season_id, st.driver_id
      FROM public.duelo_season_standings st
      JOIN public.duelo_seasons s ON s.id = st.season_id
     WHERE s.phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final')
       AND EXISTS (SELECT 1 FROM public.machine_rides mr
                    WHERE mr.driver_customer_id = st.driver_id
                      AND mr.branch_id = s.branch_id
                      AND mr.ride_status = 'FINALIZED'
                      AND mr.finalized_at >= now() - (p_hours||' hours')::interval)
  LOOP
    v_checked := v_checked + 1;
    SELECT COUNT(*)::int, MAX(mr.finalized_at)
      INTO v_expected, v_expected_last
      FROM public.machine_rides mr
      JOIN public.duelo_seasons s ON s.id = v_rec.season_id
     WHERE mr.driver_customer_id = v_rec.driver_id
       AND mr.branch_id = s.branch_id
       AND mr.ride_status = 'FINALIZED'
       AND mr.finalized_at >= s.classification_starts_at
       AND mr.finalized_at <  s.classification_ends_at;
    UPDATE public.duelo_season_standings st
       SET points = v_expected, last_ride_at = v_expected_last
     WHERE st.season_id = v_rec.season_id AND st.driver_id = v_rec.driver_id
       AND (st.points <> v_expected OR st.last_ride_at IS DISTINCT FROM v_expected_last);
    IF FOUND THEN v_fixed := v_fixed + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('checked', v_checked, 'fixed', v_fixed, 'window_hours', p_hours);
END; $$;

-- 5) Reverter duelo_backfill_standings (versão sem weekend_rides_count) → restaurar da migration 20260421230612
-- 6) Reverter duelo_create_brackets_within_tier (ORDER BY sem weekend_rides_count) → restaurar da migration 20260421230750
-- 7) Reverter duelo_apply_promotion_relegation (ORDER BY sem weekend_rides_count) → restaurar da migration 20260421230850
-- (corpos completos copiados das migrations originais — incluídos no arquivo final de rollback)

-- 8) Dropar helper
DROP FUNCTION IF EXISTS public.duelo_is_weekend_at(timestamptz, uuid);

-- 9) Dropar coluna nova
ALTER TABLE public.duelo_season_standings DROP COLUMN IF EXISTS weekend_rides_count;

COMMIT;

-- Reverter código TS: git revert do commit (volta tipos_campeonato.ts, servico_campeonato.ts, tabela_classificacao.tsx)
```

O bloco de rollback completo (com corpos integrais das funções 5/6/7) será embutido como comentário no final do arquivo de migration para referência rápida em produção.

## 2. Estimativa

- **SQL**: ~280 linhas (1 ALTER+ADD, 1 ALTER+DROP, 1 DROP/CREATE INDEX, 1 helper, 5 funções `CREATE OR REPLACE`, 1 bloco de backfill, comentário de rollback)
- **TypeScript**: ~12 linhas alteradas em 3 arquivos (`tipos_campeonato.ts`, `servico_campeonato.ts`, `tabela_classificacao.tsx`)
- **Tempo de execução em produção**: ~3–7 segundos (volumetria atual de `duelo_season_standings` e `machine_rides` em beta é mínima)
- **Tempo total da entrega** (codificação + verificação): **~5 minutos**

## 3. Impacto em ranking atual

**Cenário**: 2 motoristas empatados em `points` no mesmo tier de uma temporada em `phase='classification'`.

**Após execução**:
1. `weekend_rides_count` é populado pelo backfill com base no histórico real de `machine_rides`.
2. `position_in_tier` **não é gravado durante classification** — só é cristalizado no momento em que `duelo_advance_phases` transiciona para mata-mata.
3. Listagens via `servico_campeonato.listarClassificacao` passam imediatamente a ordenar por `points DESC, weekend_rides_count DESC, last_ride_at ASC`. Os 2 motoristas trocam de posição se um tiver mais corridas em sex/sáb/dom.
4. Próxima execução do `duelo_advance_phases` (no fim do período de classificação) usará a nova ordem para criar brackets — quem tiver mais corridas de fim de semana vira seed melhor.

**Mata-mata em andamento**: brackets já criados ficam intactos. A mudança só afeta temporadas que ainda não saíram de `classification`.

**Temporadas finalizadas**: backfill exclui via `WHERE s.phase IN ('classification','knockout_*')`, preservando o histórico em `duelo_driver_tier_history`.

## 4. `SECURITY DEFINER` no helper — concordo, não precisa

Análise correta. `branches` tem RLS pública (todo authenticated lê), e o helper é chamado:
- de dentro de funções `SECURITY DEFINER` (trigger, reconcile, backfill, advance) — herdam contexto suficiente
- potencialmente em queries ad-hoc — qualquer authenticated já lê `branches.timezone`

**Decisão**: criar como `STABLE LANGUAGE sql` simples, sem `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION public.duelo_is_weekend_at(
  p_finalized_at timestamptz, p_branch_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT EXTRACT(DOW FROM p_finalized_at AT TIME ZONE
           COALESCE((SELECT timezone FROM public.branches WHERE id = p_branch_id),
                    'America/Sao_Paulo'))::int IN (5, 6, 0);
$$;
```

Vantagens: menor superfície de risco, menos ruído no linter de segurança, e o `STABLE` permite que o planner reuse o resultado dentro da mesma query (importante no backfill agregado).

Caso o linter futuro reclame de `search_path mutable` em função não-`SECURITY DEFINER`, removemos o `SET search_path` (qualificação `public.branches` já está explícita).

## Confirmação

Mantém o rótulo da coluna na UI como **"Fim de Semana"** (versão completa) ou prefere **"FDS"** (compacto, melhor em mobile 430px)? Se não responder, executo com **"Fim de Semana"** abreviando para **"FDS"** apenas em viewports `< sm`.

Aguardando aprovação final para executar.

