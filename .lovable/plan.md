

# Confirmações de schema (antes da migração)

## 1. TAG `[MOTORISTA]`

- **Não existe tabela `user_tags`.** A "tag" é um **prefixo no campo `customers.name`**, no formato `[MOTORISTA] Nome do Motorista`.
- Tabela: `public.customers` — coluna `name text`.
- Query padrão usada em todo o projeto:
  ```sql
  SELECT id, name, branch_id, brand_id, is_active
  FROM public.customers
  WHERE brand_id = :brand_id
    AND branch_id = :branch_id
    AND name ILIKE '%[MOTORISTA]%'
    AND is_active = true;
  ```
- Confirmado em 16 arquivos do código (ex.: `hook_preview_reset.ts`, `import-drivers-bulk`, `reset-duelo-ciclo`, `ConfiguracaoModulo.tsx`).
- Existe também a tabela `driver_profiles` (perfil estendido), mas a identificação canônica de "é motorista" é o prefixo no nome.

## 2. Vínculo motorista ↔ branch

- **Direto** em `customers.branch_id uuid` (FK para `branches.id`). Não há tabela `driver_branches`.
- `customers.brand_id uuid` mantém o isolamento de marca.
- **Multi-branch**: o modelo atual é **1 motorista = 1 branch** por registro. Um mesmo CPF pode existir em mais de uma cidade como **registros distintos** em `customers` (cada um com seu `branch_id`). Isso é coerente com as regras de portabilidade (`customer-onboarding-and-access-policy`) e com o ciclo de duelo por cidade (`reset-duelo-ciclo`).
- **Implicação para o seed**: o seed roda **por `branch_id`** (escopo da temporada). Cada cidade tem seu próprio universo de motoristas. Não há necessidade de "fan-out" entre cidades.

## 3. `machine_rides`

- Coluna do motorista: **`driver_customer_id uuid`** (FK lógica para `customers.id`). Existe também `driver_id text` (ID externo da TaxiMachine) e `driver_name text`, mas a referência interna usada nos hooks é `driver_customer_id`.
- Status: coluna `ride_status text` com valores reais `ACCEPTED, CANCELLED, DENIED, FINALIZED, IN_PROGRESS, NO_VALUE, PENDING`. Corrida concluída = **`ride_status = 'FINALIZED'`**.
- Timestamp de finalização: **`finalized_at timestamptz`** (padrão `analytical-consistency-standard`).
- Escopo: `machine_rides.branch_id` e `machine_rides.brand_id` permitem filtrar diretamente por cidade.
- **Rating**: **não existe coluna de rating em `machine_rides`**. O único rating que existe hoje é em `driver_duel_ratings (rating smallint, rated_customer_id uuid, created_at timestamptz)` — é rating **de duelo entre motoristas**, não de passageiro. Não há rating de passageiro no schema atual.

# Correções aplicadas ao plano de C.1

1. **Critério de desempate "avaliação média 90d" — REMOVIDO.** Não há rating de passageiro no banco. Usar `driver_duel_ratings` distorceria a classificação inicial (mistura percepção entre motoristas com desempenho real).
   - **Novo desempate (em ordem)**:
     1. `rides_90d` desc (volume de corridas FINALIZED nos últimos 90 dias);
     2. `total_value_90d` desc (soma de `ride_value` no período — proxy direto de produtividade financeira);
     3. `last_finalized_at` desc (atividade mais recente);
     4. `customers.created_at` asc (antiguidade na plataforma como último critério).

2. **Identificação de motorista** na RPC: `customers.name ILIKE '%[MOTORISTA]%' AND branch_id = p_branch_id AND brand_id = p_brand_id AND is_active = true`. Sem dependência de `user_roles` ou `driver_profiles`.

3. **Fonte de corridas**: `machine_rides` filtrada por `branch_id`, `driver_customer_id IN (motoristas elegíveis)`, `ride_status = 'FINALIZED'`, `finalized_at >= now() - interval '90 days'`.

4. **Janela proporcional para novos (30–89 dias)**: usar `customers.created_at` da própria branch como referência de "dias ativos" para projeção linear de `rides_90d`.

5. **Multi-branch**: a RPC é **estritamente branch-scoped**. Cada `(season_id → branch_id)` tem seu próprio seed. Nada precisa mudar no schema de `duelo_tier_memberships` — `season_id` já carrega o `branch_id` indiretamente via `duelo_seasons.branch_id`.

6. **Resto do plano C.1 permanece igual**:
   - Schema novo: `duelo_season_tiers`, `duelo_tier_memberships`, `duelo_driver_tier_history`, `plan_duelo_prize_ranges`, `brand_duelo_prizes`, `duelo_champions`.
   - Alterações: `duelo_seasons` (+ `tiers_count`, `relegation_policy`, `tiers_config_json`, `tier_seeding_completed_at`), `duelo_season_standings` (+ `tier_id`, `position_in_tier`, `relegated_auto`), `duelo_brackets` (+ `tier_id`).
   - Backfill: 1 tier "Única" por temporada existente.
   - RPC `duelo_seed_initial_tier_memberships(p_season_id uuid)` `SECURITY DEFINER`, idempotente via `tier_seeding_completed_at`, com gate trigger.
   - Flag `USE_DUELO_CAMPEONATO` + `brand_settings_json.duelo_campeonato_enabled === true`.
   - Seed de `plan_duelo_prize_ranges` via ferramenta de dados (não migration).

# Detalhe técnico — núcleo da RPC (versão corrigida)

```sql
WITH elegiveis AS (
  SELECT id AS driver_id, created_at
  FROM public.customers
  WHERE brand_id  = v_brand_id
    AND branch_id = v_branch_id
    AND is_active = true
    AND name ILIKE '%[MOTORISTA]%'
),
metricas_90d AS (
  SELECT
    e.driver_id,
    e.created_at,
    COUNT(r.id)                       AS rides_90d,
    COALESCE(SUM(r.ride_value), 0)    AS total_value_90d,
    MAX(r.finalized_at)               AS last_finalized_at,
    COUNT(*) FILTER (
      WHERE r.finalized_at >= now() - interval '30 days'
    )                                 AS rides_30d
  FROM elegiveis e
  LEFT JOIN public.machine_rides r
    ON r.driver_customer_id = e.driver_id
   AND r.branch_id          = v_branch_id
   AND r.ride_status        = 'FINALIZED'
   AND r.finalized_at       >= now() - interval '90 days'
  GROUP BY e.driver_id, e.created_at
),
ranqueados AS (
  SELECT
    m.*,
    CASE
      WHEN now() - m.created_at < interval '30 days' THEN -1   -- exceção
      ELSE m.rides_90d
    END AS score_principal,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE WHEN now() - m.created_at < interval '30 days' THEN 1 ELSE 0 END ASC,
        m.rides_90d        DESC,
        m.total_value_90d  DESC,
        m.last_finalized_at DESC NULLS LAST,
        m.created_at       ASC
    ) AS rn
  FROM metricas_90d m
  WHERE m.rides_30d >= 1                       -- elegibilidade mínima
     OR now() - m.created_at < interval '30 days'  -- novo motorista entra mesmo sem 30d
)
-- distribuição em tiers via faixas cumulativas de target_size,
-- com motoristas <30 dias forçados ao último tier_order.
```

# Arquivos (inalterados em relação ao plano anterior)

**Criar**
- `supabase/migrations/<timestamp>_duelo_series_hierarquicas.sql`
- `src/features/campeonato_duelo/types/tipos_serie.ts`
- `src/compartilhados/hooks/hook_duelo_campeonato_habilitado.ts`

**Modificar**
- `src/compartilhados/constants/constantes_features.ts`
- `src/features/campeonato_duelo/types/tipos_campeonato.ts`

# Próximos passos (após aprovação)

1. Aplicar migração + backfill + criar RPC `duelo_seed_initial_tier_memberships` com a lógica corrigida acima.
2. Inserir seed de `plan_duelo_prize_ranges`.
3. Rodar linter de segurança e `tsc --noEmit`.
4. Validar compatibilidade retroativa das telas atuais.
5. Aguardar aprovação para C.2.

