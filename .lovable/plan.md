

# Correção de RLS — `plan_duelo_prize_ranges`

## Estado atual confirmado

Auditoria de `pg_policies` revelou que **apenas `plan_duelo_prize_ranges` tem políticas vulneráveis ativas**. As outras 5 tabelas do alerta já estão corretas.

| Tabela | `public_read` | `select_all` | `_root_only` duplicada | Status |
|---|---|---|---|---|
| `plan_duelo_prize_ranges` | **SIM** (anon+auth, USING true) | **SIM** (auth, USING true) | **SIM** | Corrigir |
| `duelo_season_tiers` | Não | Não | Não | Limpa |
| `duelo_tier_memberships` | Não | Não | Não | Limpa |
| `duelo_driver_tier_history` | Não | Não | Não | Limpa |
| `brand_duelo_prizes_v2` | Não | Não | Não | Limpa |
| `duelo_champions` | Não | Não | Não | Mantida |

## Migração

Arquivo: `supabase/migrations/<timestamp>_fix_rls_plan_duelo_prize_ranges.sql`

```sql
-- 1) Remove leitura anônima das faixas comerciais
DROP POLICY IF EXISTS "plan_duelo_prize_ranges_public_read"
  ON public.plan_duelo_prize_ranges;

-- 2) Remove leitura ampla para authenticated (vaza min/max por plano)
DROP POLICY IF EXISTS "plan_duelo_prize_ranges_select_all"
  ON public.plan_duelo_prize_ranges;

-- 3) Remove política duplicada de root (consolida em _root_all)
DROP POLICY IF EXISTS "plan_duelo_prize_ranges_root_only"
  ON public.plan_duelo_prize_ranges;

-- 4) DROPs idempotentes das demais tabelas listadas no alerta
DROP POLICY IF EXISTS "duelo_season_tiers_public_read"        ON public.duelo_season_tiers;
DROP POLICY IF EXISTS "duelo_tier_memberships_public_read"    ON public.duelo_tier_memberships;
DROP POLICY IF EXISTS "duelo_driver_tier_history_public_read" ON public.duelo_driver_tier_history;
DROP POLICY IF EXISTS "brand_duelo_prizes_v2_public_read"     ON public.brand_duelo_prizes_v2;
```

## Verificação pós-migração

1. Re-executar o `SELECT` em `pg_policies` (mesma query do alerta).
2. Rodar `supabase--linter`.
3. Confirmar textualmente:
   - Zero políticas com `roles={anon,authenticated}` ou `qual=true` nas 5 tabelas alvo.
   - `plan_duelo_prize_ranges` fica apenas com `_root_all`.
   - `duelo_season_tiers`, `duelo_tier_memberships`, `duelo_driver_tier_history`, `brand_duelo_prizes_v2` mantêm `_root_all`, `_brand_admin_all`, `_branch_admin_select`.
   - `duelo_champions` permanece inalterada (`_admin_write` + `_select_scope`).

## Observação sobre commit hash

Lovable não expõe hash de commit Git nas migrações aplicadas via plataforma. Vou entregar como identificador o **timestamp + nome do arquivo de migração** gerado, que é a referência rastreável dentro do projeto.

## Próximos passos

Após verificação OK, aguardo sua aprovação explícita para iniciar **C.2** (motor de pontuação, avanço de fase, promoção/rebaixamento entre temporadas).

