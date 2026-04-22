

# Corrigir erro "scoring_config_json column not found" ao criar temporada

## Diagnóstico

O frontend (`servico_campeonato_empreendedor.ts` + `schema_criar_temporada.ts`) já envia dois campos novos no INSERT em `duelo_seasons`:
- `scoring_mode` (`total_points` ou `daily_matchup`)
- `scoring_config_json` (`{ win, draw, loss }`)

Mas a tabela `duelo_seasons` no banco **não tem essas colunas**. Verificado via `information_schema`: as colunas existentes são apenas `id, brand_id, branch_id, name, year, month, phase, classification_*, knockout_*, tiers_count, tiers_config_json, ...`. Por isso o PostgREST devolve "Could not find the 'scoring_config_json' column ... in the schema cache" e o botão "Criar temporada" falha.

Nenhuma RPC ou trigger atual usa esses campos, então a correção é puramente aditiva.

## O que vou fazer

### 1) Migration: adicionar as colunas em `duelo_seasons`

```sql
ALTER TABLE public.duelo_seasons
  ADD COLUMN IF NOT EXISTS scoring_mode text NOT NULL DEFAULT 'total_points',
  ADD COLUMN IF NOT EXISTS scoring_config_json jsonb NOT NULL DEFAULT '{"win":3,"draw":1,"loss":0}'::jsonb;

-- Validação leve (modo conhecido)
ALTER TABLE public.duelo_seasons
  ADD CONSTRAINT duelo_seasons_scoring_mode_chk
  CHECK (scoring_mode IN ('total_points','daily_matchup'));
```

- `IF NOT EXISTS` → idempotente.
- `DEFAULT` cobre temporadas já existentes sem precisar de backfill manual.
- O CHECK é estático (não usa `now()`), então é seguro como constraint.

### 2) Hardening defensivo no serviço

Em `servico_campeonato_empreendedor.ts`, hoje o INSERT usa `.single()`. Quando o PostgREST falha com "schema cache", o erro mostrado já é claro, mas vou:
- Trocar `.single()` por `.maybeSingle()` no retorno do INSERT, e validar `if (!season) throw new Error("Não foi possível criar a temporada")` para evitar crash silencioso em qualquer cenário futuro de RLS.

Sem outras mudanças. O fluxo do formulário e a validação Zod permanecem intactos.

## Resultado esperado

- Botão "Criar temporada" passa a funcionar para a marca Meu Mototáxi (e qualquer outra em modo campeonato).
- Temporadas pré-existentes continuam válidas com defaults `total_points` + `{win:3,draw:1,loss:0}`.
- Nenhum impacto em RPCs/cron — eles não leem esses campos ainda.

## Arquivos

**Backend (1 migration nova):**
- `supabase/migrations/<timestamp>_add_scoring_to_duelo_seasons.sql`

**Frontend (1 arquivo):**
- `src/features/campeonato_duelo/services/servico_campeonato_empreendedor.ts` — `.single()` → `.maybeSingle()` + guard de retorno vazio

## Risco e rollback

- **Risco mínimo**: ALTER TABLE aditivo com defaults; não quebra nenhum SELECT existente.
- **Rollback**: `ALTER TABLE public.duelo_seasons DROP COLUMN scoring_mode, DROP COLUMN scoring_config_json;`

