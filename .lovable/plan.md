

# Sub-fase C.2 — Motor do Campeonato Duelo (Séries Hierárquicas)

## Confirmações de schema (antes do plano)

| Item | Resposta |
|---|---|
| Coluna status em `machine_rides` | `ride_status text`, default `'PENDING'` |
| Valor de finalização | `'FINALIZED'` (one-way confirmado) |
| Timestamp de finalização | `finalized_at timestamptz` (nullable) |
| Coluna driver | `driver_customer_id uuid` (FK lógica para `customers.id`) |
| **Rating em `machine_rides`** | **Não existe.** Não há coluna de avaliação por corrida. Único rating é `driver_duel_ratings.rating smallint` (rating motorista→motorista, fora de C.2) |
| `pg_cron` instalado | **Sim**, v1.6.4 (`pg_net` v0.19.5) |
| `branches.timezone` | Existe (text) — usaremos para reconciliação local |

**Implicação crítica**: `five_star_count` **não pode ser alimentado** pelo motor de corridas. Proposta abaixo (Q1).

## Decisões adicionais que precisam ser confirmadas

### Q1 — `five_star_count` na C.2

`duelo_season_standings.five_star_count` foi pensado como tiebreaker. Como não existe rating em `machine_rides`, **proponho congelar o campo em 0 nesta sub-fase** e remover o critério de desempate dele em C.2, usando apenas `points DESC, last_ride_at ASC` (mais antigo desempata melhor — recompensa quem chegou no mesmo placar primeiro). Em C.5 (futura integração com avaliação do passageiro) reativamos. **Confirme antes de eu codar.**

### Q2 — Race condition (2 corridas simultâneas)

Trigger usará `UPDATE ... WHERE season_id=X AND driver_id=Y RETURNING id` com `points = points + 1` atômico no Postgres. Não precisa de lock explícito — `UPDATE` no mesmo row é serializado por MVCC. O caso "standing não existe" usa `INSERT ... ON CONFLICT (season_id, driver_id) DO UPDATE SET points = standings.points + 1, last_ride_at = EXCLUDED.last_ride_at` para tornar a operação idempotente sob concorrência.

### Q3 — Timezone do cron (00:00 local)

`pg_cron` opera em **UTC** no Supabase. Proposta: cron único **a cada 1 hora** (`0 * * * *`) que chama `duelo_advance_phases()`. A função interna itera por temporada e usa `branches.timezone` para decidir se `now() AT TIME ZONE tz` cruzou `00:00` local **e** se `classification_ends_at` já passou. Idempotência via `phase` atual + flags. Vantagem: fuso correto por cidade, sem cron por branch. **Confirme.**

### Q4 — Motorista muda de `branch_id` no meio da temporada

Política proposta: **temporada é branch-bound, motorista permanece na temporada onde foi seedado**. Se o `customers.branch_id` muda, novas corridas em outra branch **não contam** para a temporada antiga (trigger filtra por `branch_id` da corrida = `branch_id` da temporada). Para entrar na temporada da nova branch precisa aguardar a próxima (com seed inicial). **Confirme.**

### Q5 — Temporada criada DEPOIS de já haver corridas no período

Proposta: a RPC `duelo_seed_initial_tier_memberships` (já existente) faz o seed dos motoristas, e a **nova RPC `duelo_backfill_standings(p_season_id)`** varre `machine_rides FINALIZED` entre `classification_starts_at` e `min(now(), classification_ends_at)` e popula standings. Idempotente (TRUNCATE+INSERT em transação se `phase='classification'`). Disparada manualmente pelo empreendedor após criar a temporada (UI virá em C.4).

## Entregáveis da C.2

### Migrations (3 arquivos)

#### `<ts>_duelo_motor_pontuacao.sql` — P1 + P2
- `duelo_update_standings_from_ride()` — `SECURITY DEFINER`, `search_path=public`
  - Trigger `AFTER INSERT OR UPDATE ON machine_rides`
  - Guarda: `NEW.ride_status='FINALIZED' AND (TG_OP='INSERT' OR OLD.ride_status<>'FINALIZED')`
  - Resolve temporada ativa por `branch_id` + `phase='classification'` + `classification_ends_at > NEW.finalized_at`
  - Resolve `tier_id` via `duelo_tier_memberships`
  - **Se membership não existe**: log em `duelo_attempts_log` (`code='no_membership'`) e `RETURN NEW` (motorista não foi seedado, não conta)
  - `INSERT INTO duelo_season_standings (season_id, driver_id, brand_id, branch_id, tier_id, points, last_ride_at) VALUES (..., 1, NEW.finalized_at) ON CONFLICT (season_id, driver_id) DO UPDATE SET points=standings.points+1, last_ride_at=GREATEST(standings.last_ride_at, EXCLUDED.last_ride_at), updated_at=now()`
  - Garantir UNIQUE `(season_id, driver_id)` em `duelo_season_standings` (verificar se já existe; criar se faltar)
- `duelo_reconcile_standings(p_hours int default 48)` — `SECURITY DEFINER`
  - Reagrega `count(*) FROM machine_rides WHERE finalized_at >= now() - p_hours*interval '1 hour' AND ride_status='FINALIZED'`
  - Para cada `(season_id, driver_id)` com divergência: `UPDATE` + log em `duelo_attempts_log` (`code='reconcile_diff'`)
- `duelo_backfill_standings(p_season_id uuid)` — para Q5
- Cron: `duelo-reconcile-daily` rodando `04:00 UTC` (`0 4 * * *`) chamando edge function `duelo-reconcile` (que invoca a RPC com service role)

#### `<ts>_duelo_advance_phases.sql` — P3
- `duelo_advance_phases()` — `SECURITY DEFINER`, idempotente
  - Loop por temporada com `phase NOT IN ('finished')`
  - Resolve `tz = COALESCE(branches.timezone, 'America/Sao_Paulo')`
  - **Classification → Knockout**: se `now() >= classification_ends_at`:
    - Para cada tier: `ROW_NUMBER() OVER (PARTITION BY tier_id ORDER BY points DESC, last_ride_at ASC NULLS LAST) AS position_in_tier`
    - Adaptação por tamanho do tier:
      - ≥16 standings com `points>=1`: top 16 → `phase='knockout_r16'`, 8 brackets seed 1×16, 2×15...
      - 8–15: top 8 → `phase='knockout_qf'`, 4 brackets
      - 4–7: top 4 → `phase='knockout_sf'`, 2 brackets
      - 2–3: top 2 → `phase='knockout_final'`, 1 bracket
      - <2: tier "abortado" → standings ficam, mas sem mata-mata; tier marcado com flag `aborted` em `duelo_season_tiers` (nova coluna `aborted_at timestamptz`)
    - `bracket_scope` (nova coluna em `duelo_brackets`): `'within_tier'`
    - `starts_at = now()`, `ends_at = now() + interval` calculado para distribuir uniformemente até `knockout_ends_at`
  - **Round → próximo round**: se todos brackets do round atual têm `winner_id` OU `ends_at <= now()`:
    - Apurar vencedor por `driver_X_rides` (incrementado por trigger separado — ver abaixo) com tiebreaker `last_ride_at ASC`
    - Empate sem corrida: vencedor por melhor `position_in_tier` na classificação
    - Promover vencedores para próximo round mantendo seed
    - Se era `knockout_final`: `INSERT INTO duelo_champions` + `phase='finished'`
  - Após `phase='finished'`: chamar `duelo_apply_promotion_relegation(season_id)`
- **Trigger auxiliar** `duelo_increment_bracket_rides`: `AFTER INSERT OR UPDATE ON machine_rides` (separada da pontuação) — quando `ride_status='FINALIZED'` e existe `bracket` ativo no tier do motorista no período, incrementa `driver_a_rides` ou `driver_b_rides`
- Cron: `duelo-advance-phases-hourly` (`0 * * * *`) chamando edge function `duelo-cron-advance`

#### `<ts>_duelo_promocao_rebaixamento.sql` — P4 + P5
- `duelo_apply_promotion_relegation(p_season_id uuid)` — `SECURITY DEFINER`, idempotente via flag `promotion_applied_at` (nova coluna em `duelo_seasons`)
- Algoritmo em transação única:
  1. **P5 — Zero pontos cai 1 série**: `UPDATE duelo_tier_memberships SET tier_id = (próximo tier_order)` para drivers com `points=0` (exceto último tier). Marca `relegated_auto=true` no standings. Outcome `'relegated_zero'` no history
  2. **Rebaixamento normal**: para cada tier exceto último, pegar bottom `relegation_count` (excluindo já rebaixados por zero) por `position_in_tier DESC`. Outcome `'relegated'`
  3. **Promoção**: para cada tier exceto primeiro, pegar top `promotion_count` do tier abaixo (excluindo rebaixados por zero) por `position_in_tier ASC`. Outcome `'promoted'`
  4. Demais: outcome `'stayed'`. Campeão do tier 1 (primeira posição final): outcome `'champion'`
  5. Persistir tudo em `duelo_driver_tier_history` com `starting_tier_id`, `ending_tier_id`, `ending_position`
  6. **Não atualiza** `duelo_tier_memberships` da temporada finalizada (histórica). Próxima temporada da branch lerá de `duelo_driver_tier_history` (não mais do seed inicial)
- Audit em `duelo_attempts_log` com summary JSON

### Edge functions (3 novas)
- `supabase/functions/duelo-cron-reconcile/index.ts` — chama `duelo_reconcile_standings(48)`
- `supabase/functions/duelo-cron-advance/index.ts` — chama `duelo_advance_phases()`
- Ambas: `verify_jwt = false` em `supabase/config.toml`, usam `SUPABASE_ANON_KEY` (padrão Cron Auth Pattern do memory)

### Tipos TypeScript
- `src/features/campeonato_duelo/types/tipos_motor.ts`: `ResultadoReconciliacao`, `ResultadoAvanco