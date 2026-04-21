

## Sub-fase C.1 — Schema + Seed do Campeonato Duelo Motorista

### 1. Decisões e ajustes ao briefing original

**Ajuste crítico de FKs**: o projeto **não tem** tabelas `drivers` nem `rides`. Motoristas são `customers` com tag `[MOTORISTA]` no nome (campo `external_driver_id`/`customer_tier`), e corridas são `machine_rides`. Vou trocar todas as FKs para refletir a realidade:

- `driver_id uuid → customers(id)` (em vez de `drivers`)
- `event_ref_id uuid` referencia `machine_rides(id)` (sem FK forte, pois `machine_rides` pode ter SET NULL/limpeza)
- O termo "driver" fica apenas nas **colunas** (mantendo a semântica do produto: o `customer` é o motorista da temporada).

**Helpers RLS confirmados**: existem `get_user_brand_ids(uuid)`, `get_user_branch_ids(uuid)` e `has_role(uuid, app_role)`. Sigo exatamente o padrão de `city_business_model_overrides` (4 policies por tabela: select_scope amplo + root_admin_all + brand_admin_manage + branch_admin_manage quando aplicável).

**Migration única**: schema + RLS + seed em um arquivo só, commit atômico.

**Flag**: `constantes_features.ts` já existe e tem `USE_BUSINESS_MODELS = false`. Adição de `USE_DUELO_CAMPEONATO = false` é não-breaking.

### 2. SQL completo da migration

Arquivo: `supabase/migrations/<timestamp>_duelo_campeonato_schema_e_seed.sql`

```sql
-- =====================================================================
-- CAMPEONATO DUELO MOTORISTA — Sub-fase C.1
-- Schema (7 tabelas), RLS multi-tenant e seed de plan_duelo_prize_ranges
-- =====================================================================

-- 1. duelo_seasons -----------------------------------------------------
CREATE TABLE public.duelo_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  phase text NOT NULL DEFAULT 'classification'
    CHECK (phase IN ('classification','knockout_r16','knockout_qf','knockout_sf','knockout_final','finished')),
  classification_starts_at timestamptz NOT NULL,
  classification_ends_at   timestamptz NOT NULL,
  knockout_starts_at       timestamptz NOT NULL,
  knockout_ends_at         timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, branch_id, year, month)
);
CREATE INDEX idx_duelo_seasons_brand_branch_period
  ON public.duelo_seasons (brand_id, branch_id, year DESC, month DESC);
CREATE TRIGGER trg_duelo_seasons_updated_at
  BEFORE UPDATE ON public.duelo_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. duelo_season_standings -------------------------------------------
CREATE TABLE public.duelo_season_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  five_star_count int NOT NULL DEFAULT 0,
  last_ride_at timestamptz,
  position int,
  qualified boolean NOT NULL DEFAULT false,
  UNIQUE (season_id, driver_id)
);
CREATE INDEX idx_duelo_standings_ranking
  ON public.duelo_season_standings (season_id, points DESC, five_star_count DESC, last_ride_at ASC);

-- 3. duelo_brackets ----------------------------------------------------
CREATE TABLE public.duelo_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  round text NOT NULL CHECK (round IN ('r16','qf','sf','final')),
  slot int NOT NULL,
  driver_a_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  driver_b_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  driver_a_rides int NOT NULL DEFAULT 0,
  driver_b_rides int NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  UNIQUE (season_id, round, slot)
);
CREATE INDEX idx_duelo_brackets_season_round
  ON public.duelo_brackets (season_id, round);

-- 4. duelo_match_events -----------------------------------------------
CREATE TABLE public.duelo_match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES public.duelo_brackets(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'ride_completed',
  event_ref_id uuid,            -- machine_rides.id; sem FK forte (limpeza independente)
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_duelo_match_events_bracket_driver
  ON public.duelo_match_events (bracket_id, driver_id);

-- 5. plan_duelo_prize_ranges (governança Raiz) ------------------------
CREATE TABLE public.plan_duelo_prize_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL,
  position text NOT NULL CHECK (position IN ('champion','runner_up','semifinalist','quarterfinalist','r16')),
  min_points int NOT NULL CHECK (min_points >= 0),
  max_points int NOT NULL CHECK (max_points >= min_points),
  UNIQUE (plan_key, position)
);

-- 6. brand_duelo_prizes (configuração do empreendedor) ---------------
CREATE TABLE public.brand_duelo_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('champion','runner_up','semifinalist','quarterfinalist','r16')),
  points_reward int NOT NULL CHECK (points_reward >= 0),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, position)
);
CREATE INDEX idx_brand_duelo_prizes_brand ON public.brand_duelo_prizes (brand_id);

-- 7. duelo_champions (Hall da Fama) -----------------------------------
CREATE TABLE public.duelo_champions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL UNIQUE REFERENCES public.duelo_seasons(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  champion_driver_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  runner_up_driver_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  semifinalist_ids uuid[] NOT NULL DEFAULT '{}',
  quarterfinalist_ids uuid[] NOT NULL DEFAULT '{}',
  r16_ids uuid[] NOT NULL DEFAULT '{}',
  prizes_distributed boolean NOT NULL DEFAULT false,
  finalized_at timestamptz
);
CREATE INDEX idx_duelo_champions_brand_branch ON public.duelo_champions (brand_id, branch_id);

-- =====================================================================
-- RLS — padrão city_business_model_overrides
-- =====================================================================
ALTER TABLE public.duelo_seasons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_season_standings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_brackets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_match_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_duelo_prize_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_duelo_prizes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duelo_champions         ENABLE ROW LEVEL SECURITY;

-- duelo_seasons (tem brand_id + branch_id)
CREATE POLICY "duelo_seasons_select_scope" ON public.duelo_seasons FOR SELECT TO authenticated
USING (has_role(auth.uid(),'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
       OR branch_id IN (SELECT get_user_branch_ids(auth.uid())));
CREATE POLICY "duelo_seasons_root_all" ON public.duelo_seasons TO authenticated
USING (has_role(auth.uid(),'root_admin')) WITH CHECK (has_role(auth.uid(),'root_admin'));
CREATE POLICY "duelo_seasons_brand_admin" ON public.duelo_seasons TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'))
WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'));
CREATE POLICY "duelo_seasons_branch_admin" ON public.duelo_seasons TO authenticated
USING (branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'))
WITH CHECK (branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin'));

-- duelo_season_standings / duelo_brackets / duelo_match_events / duelo_champions
-- escopo via JOIN com duelo_seasons (security via EXISTS)
CREATE POLICY "duelo_standings_scope" ON public.duelo_season_standings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id
  AND (has_role(auth.uid(),'root_admin') OR s.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
       OR s.branch_id IN (SELECT get_user_branch_ids(auth.uid())))));
CREATE POLICY "duelo_standings_admin_write" ON public.duelo_season_standings TO authenticated
USING (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id
  AND (has_role(auth.uid(),'root_admin')
       OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'))
       OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin')))))
WITH CHECK (EXISTS (SELECT 1 FROM public.duelo_seasons s WHERE s.id = season_id
  AND (has_role(auth.uid(),'root_admin')
       OR (s.brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'))
       OR (s.branch_id IN (SELECT get_user_branch_ids(auth.uid())) AND has_role(auth.uid(),'branch_admin')))));

-- mesmas duas policies replicadas para duelo_brackets, duelo_match_events e duelo_champions
-- (criadas no arquivo final com nomes únicos: duelo_brackets_scope/_admin_write etc.)

-- plan_duelo_prize_ranges (governança raiz)
CREATE POLICY "plan_duelo_prize_ranges_select_all" ON public.plan_duelo_prize_ranges FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_duelo_prize_ranges_root_only" ON public.plan_duelo_prize_ranges TO authenticated
USING (has_role(auth.uid(),'root_admin')) WITH CHECK (has_role(auth.uid(),'root_admin'));

-- brand_duelo_prizes
CREATE POLICY "brand_duelo_prizes_select_scope" ON public.brand_duelo_prizes FOR SELECT TO authenticated
USING (has_role(auth.uid(),'root_admin') OR brand_id IN (SELECT get_user_brand_ids(auth.uid())));
CREATE POLICY "brand_duelo_prizes_root_all" ON public.brand_duelo_prizes TO authenticated
USING (has_role(auth.uid(),'root_admin')) WITH CHECK (has_role(auth.uid(),'root_admin'));
CREATE POLICY "brand_duelo_prizes_brand_admin" ON public.brand_duelo_prizes TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'))
WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())) AND has_role(auth.uid(),'brand_admin'));

-- =====================================================================
-- SEED — plan_duelo_prize_ranges (4 planos × 5 posições = 20 linhas)
-- =====================================================================
INSERT INTO public.plan_duelo_prize_ranges (plan_key, position, min_points, max_points) VALUES
  -- champion
  ('free','champion',1000,5000),
  ('starter','champion',3000,15000),
  ('profissional','champion',5000,30000),
  ('enterprise','champion',10000,100000),
  -- runner_up
  ('free','runner_up',500,2500),
  ('starter','runner_up',1500,7500),
  ('profissional','runner_up',2500,15000),
  ('enterprise','runner_up',5000,50000),
  -- semifinalist
  ('free','semifinalist',250,1250),
  ('starter','semifinalist',750,3750),
  ('profissional','semifinalist',1250,7500),
  ('enterprise','semifinalist',2500,25000),
  -- quarterfinalist
  ('free','quarterfinalist',100,500),
  ('starter','quarterfinalist',300,1500),
  ('profissional','quarterfinalist',500,3000),
  ('enterprise','quarterfinalist',1000,10000),
  -- r16
  ('free','r16',30,150),
  ('starter','r16',100,500),
  ('profissional','r16',170,1000),
  ('enterprise','r16',350,3000);

-- =====================================================================
-- ROLLBACK (comentado) — ordem reversa de FK
-- =====================================================================
-- DROP TABLE IF EXISTS public.duelo_champions;
-- DROP TABLE IF EXISTS public.brand_duelo_prizes;
-- DROP TABLE IF EXISTS public.plan_duelo_prize_ranges;
-- DROP TABLE IF EXISTS public.duelo_match_events;
-- DROP TABLE IF EXISTS public.duelo_brackets;
-- DROP TABLE IF EXISTS public.duelo_season_standings;
-- DROP TABLE IF EXISTS public.duelo_seasons;
```

### 3. Edição em `constantes_features.ts`

```ts
/**
 * Liga funcionalidade Campeonato Duelo Motorista (Brasileirão dos motoristas).
 * Por brand: brand_settings_json.duelo_campeonato_enabled === true.
 * Independente de USE_BUSINESS_MODELS.
 */
export const USE_DUELO_CAMPEONATO = false;
```

### 4. Respostas às 8 questões

1. **Nada quebra**: as 7 tabelas são novas e isoladas; FKs corrigidas para `customers` (motoristas) e `branches/brands` existentes. Nenhum trigger toca tabelas existentes.
2. **Seed de ranges**: faz sentido como placeholder. Sugiro **manter exatamente** o briefing — a Raiz ajusta na C.4.
3. **Migration única** (schema + RLS + seed). Commit atômico.
4. **Ordem de rollback** (FK reverso): `duelo_champions` → `brand_duelo_prizes` → `plan_duelo_prize_ranges` → `duelo_match_events` → `duelo_brackets` → `duelo_season_standings` → `duelo_seasons`.
5. **Flag**: `constantes_features.ts` já existe; adição de `USE_DUELO_CAMPEONATO = false` é não-breaking (constante nova, sem consumidores).
6. **Nome do arquivo**: `<timestamp>_duelo_campeonato_schema_e_seed.sql` (timestamp gerado pela tooling).
7. **Estimativa**: ~5 min de execução de migration; ~10 min de revisão. Implementação total da sub-fase: ~20 min.
8. **Testes de aceite SQL pós-criação**:
```sql
-- contagem das tabelas
SELECT 'duelo_seasons' t, count(*) FROM duelo_seasons
UNION ALL SELECT 'duelo_season_standings', count(*) FROM duelo_season_standings
UNION ALL SELECT 'duelo_brackets', count(*) FROM duelo_brackets
UNION ALL SELECT 'duelo_match_events', count(*) FROM duelo_match_events
UNION ALL SELECT 'plan_duelo_prize_ranges', count(*) FROM plan_duelo_prize_ranges -- esperado: 20
UNION ALL SELECT 'brand_duelo_prizes', count(*) FROM brand_duelo_prizes
UNION ALL SELECT 'duelo_champions', count(*) FROM duelo_champions;

-- RLS habilitada nas 7
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname='public' AND tablename LIKE 'duelo_%' OR tablename IN ('plan_duelo_prize_ranges','brand_duelo_prizes');
```

### 5. Arquivos novos
- `supabase/migrations/<timestamp>_duelo_campeonato_schema_e_seed.sql`

### 6. Arquivos editados
- `src/compartilhados/constants/constantes_features.ts` (adiciona `USE_DUELO_CAMPEONATO = false`)

### 7. Critério de aceite
1. As 7 tabelas existem, com PKs/FKs/uniques/indexes conforme spec.
2. RLS habilitada nas 7 com policies do padrão `city_business_model_overrides`.
3. `plan_duelo_prize_ranges` tem exatamente 20 linhas (4 planos × 5 posições).
4. `brand_duelo_prizes` vazia (zero seed proposital).
5. `npx tsc --noEmit` limpo.
6. Flag `USE_DUELO_CAMPEONATO` exportada e `false` por padrão.
7. Nada de UI, RPC, trigger ou cron — pura infraestrutura.

### 8. Restrições respeitadas
- Multi-tenant via `get_user_brand_ids` / `get_user_branch_ids` / `has_role` (memória `brand-guard` e `multi-tenant-data-protection`).
- Sem realtime (não exigido nesta fase).
- Sem mudança em `business_models` — Campeonato é sub-produto do `duelo_motorista` existente.
- Flag em `branch_settings_json` segue convenção `=== true` (memória `city-flag-resolution-rule`) — será usada quando entrar UI nas C.2+.

