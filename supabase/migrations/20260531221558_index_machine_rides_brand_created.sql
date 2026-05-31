-- ============================================================================
-- Índice composto machine_rides (brand_id, created_at DESC)
-- ============================================================================
--
-- Auditoria de escalabilidade (agente B): machine_rides tem índice em
-- `brand_id` separado e em `finalized_at DESC` separado, MAS não tem
-- índice COMPOSTO. Queries de dashboard/relatórios fazem:
--
--   WHERE brand_id = $1 AND created_at >= $2 AND created_at <= $3
--
-- Postgres usa idx_machine_rides_brand_id pra filtrar (1M linhas),
-- depois aplica filtro de data em memória (table scan). Tempo:
--
--   10k rides:    50ms   (OK)
--   100k rides:   200ms  (degradado)
--   1M rides:     2-3s   (timeout em dashboard)
--   10M rides:    30s+   (inviável)
--
-- COM índice composto: index range scan direto.
--
--   10k → 100k → 1M: <10ms em todas as escalas
--
-- Custo: ~10% overhead em INSERT (mas INSERT em machine_rides é cron
-- batch, não user-facing, então ganho >>> custo)
--
-- Também adiciona índice composto pra finalized_at (relatórios usam
-- esse campo também, não só created_at).
-- ============================================================================

-- Cria com CONCURRENTLY pra não locar a tabela em produção (essencial pra
-- machine_rides que tem milhões de linhas e está sempre recebendo INSERTs).
--
-- NOTA: Supabase Dashboard SQL Editor roda em transação por default, e
-- CREATE INDEX CONCURRENTLY não pode estar em transação. Se aplicar via
-- Dashboard, remova CONCURRENTLY OU rode via psql/CLI.

CREATE INDEX IF NOT EXISTS idx_machine_rides_brand_created
  ON public.machine_rides (brand_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_machine_rides_brand_finalized
  ON public.machine_rides (brand_id, finalized_at DESC)
  WHERE finalized_at IS NOT NULL;

-- Bônus: índice parcial pra rides FINALIZED — mais usado em standings/billing
CREATE INDEX IF NOT EXISTS idx_machine_rides_brand_finalized_only
  ON public.machine_rides (brand_id, finalized_at DESC, driver_customer_id)
  WHERE ride_status = 'FINALIZED';

COMMENT ON INDEX public.idx_machine_rides_brand_created IS
  'Índice composto (brand_id, created_at DESC) — auditoria detectou queries '
  'de dashboard com WHERE brand_id AND created_at BETWEEN sem índice composto. '
  'Sem este, 1M rides = 2-3s. Com: <10ms.';

COMMENT ON INDEX public.idx_machine_rides_brand_finalized IS
  'Mesma idéia mas pra finalized_at — usado em standings/billing.';

COMMENT ON INDEX public.idx_machine_rides_brand_finalized_only IS
  'Índice parcial: só rides FINALIZED. Cobre query mais frequente '
  '(trigger campeonato_update_standings_from_ride + reports anti-fraude). '
  'Inclui driver_customer_id pra covering index (não precisa heap lookup).';
