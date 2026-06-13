-- ─────────────────────────────────────────────────────────────────────────────
-- Performance Audit — DB query / index hotspots
--
-- USO:
--   Cole no SQL Editor do Supabase (Dashboard) e rode bloco a bloco. Cada
--   seção retorna um aspecto diferente de saúde do schema sob carga real
--   de produção (números refletem stats coletadas desde o último reset).
--
-- PRÉ-REQUISITO:
--   Extensão pg_stat_statements habilitada. Se ainda não estiver:
--     CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
--   No Supabase managed, geralmente já vem ativa.
--
-- QUANDO RODAR:
--   - Trimestralmente, ou
--   - Quando user reportar "está lento", ou
--   - Antes de adicionar índice (pra ter baseline)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Top 20 queries mais lentas (mean_exec_time) ──────────────────────────
-- O alvo de otimização — queries que somam muito tempo em produção.
-- Cuidado: SELECT * em pg_stat_statements pode incluir queries do próprio
-- pgAdmin/Supabase Studio; filtre por padrão se necessário.
SELECT
  '1_QUERIES_LENTAS' AS secao,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(total_exec_time::numeric / 1000, 2) AS total_seconds,
  calls,
  ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total,
  LEFT(query, 120) AS query_preview
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
  AND query NOT ILIKE '%pg_catalog%'
  AND calls > 10  -- Ignora queries one-off / debug
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ── 2. Queries que consomem mais tempo total ────────────────────────────────
-- Diferente de #1: aqui priorizamos volume × custo. Query rápida mas
-- chamada 1M vezes pode estar dominando o budget de CPU.
SELECT
  '2_HOT_PATH' AS secao,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  calls,
  ROUND(total_exec_time::numeric / 1000, 2) AS total_seconds,
  ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total,
  LEFT(query, 120) AS query_preview
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
  AND query NOT ILIKE '%pg_catalog%'
ORDER BY total_exec_time DESC
LIMIT 20;

-- ── 3. Tabelas com mais sequential scans (índices ausentes?) ────────────────
-- seq_scan alto em tabela grande = falta índice na coluna WHERE/JOIN.
-- idx_scan baixo confirma que planner está fazendo full table scan.
SELECT
  '3_TABELAS_SEM_INDEX' AS secao,
  schemaname || '.' || relname AS tabela,
  seq_scan,
  idx_scan,
  CASE WHEN seq_scan + idx_scan = 0 THEN 0
       ELSE ROUND((100.0 * seq_scan / (seq_scan + idx_scan))::numeric, 1)
  END AS pct_seqscan,
  n_live_tup AS linhas_vivas,
  pg_size_pretty(pg_relation_size(relid)) AS tamanho
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 100  -- Ignora tabelas frias
  AND n_live_tup > 1000  -- Ignora tabelas pequenas (seq scan é OK nelas)
ORDER BY seq_scan * n_live_tup DESC  -- Custo aproximado total
LIMIT 20;

-- ── 4. Índices NUNCA usados ─────────────────────────────────────────────────
-- Candidatos a DROP — ocupam espaço, retardam INSERT/UPDATE sem benefício.
-- Cuidado: pode aparecer índice recém-criado ou usado só em ad-hoc.
-- Confirme em 2-3 leituras espaçadas antes de droppar.
SELECT
  '4_INDICES_NAO_USADOS' AS secao,
  schemaname || '.' || relname AS tabela,
  indexrelname AS indice,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho,
  idx_scan AS uses_desde_reset
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND NOT indexrelname LIKE '%_pkey'  -- PK sempre fica
  AND NOT indexrelname LIKE '%_unique'  -- UNIQUE é constraint, não otimização
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 30;

-- ── 5. Tabelas com dead tuples acumuladas (VACUUM pendente) ─────────────────
-- n_dead_tup alto vs n_live_tup degrada performance de scan e infla disco.
-- Supabase auto-vacuum geralmente cuida, mas tabelas com churn pesado
-- (points_ledger, machine_rides) podem precisar de ajuste manual.
SELECT
  '5_VACUUM_PENDENTE' AS secao,
  schemaname || '.' || relname AS tabela,
  n_live_tup AS vivas,
  n_dead_tup AS mortas,
  CASE WHEN n_live_tup = 0 THEN 0
       ELSE ROUND((100.0 * n_dead_tup / n_live_tup)::numeric, 1)
  END AS pct_mortas,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 15;

-- ── 6. Cache hit ratio (% de leituras que vêm de memória) ───────────────────
-- < 99% sugere RAM insuficiente pra working set, ou queries scaneando muito.
-- Idealmente > 99.5% em produção saudável.
SELECT
  '6_CACHE_HIT_RATIO' AS secao,
  ROUND(SUM(heap_blks_hit)::numeric * 100
        / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0), 2) AS heap_hit_pct,
  ROUND(SUM(idx_blks_hit)::numeric * 100
        / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2) AS idx_hit_pct
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- ── 7. Conexões ativas + estado ─────────────────────────────────────────────
-- "idle in transaction" persistente = leak de conexão em algum cliente/edge.
SELECT
  '7_CONEXOES' AS secao,
  state,
  COUNT(*) AS quantas,
  MAX(now() - state_change) AS oldest_in_state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY quantas DESC;

-- ── ÚTIL: resetar contadores (rodar só após salvar baseline!) ───────────────
-- SELECT pg_stat_statements_reset();
-- SELECT pg_stat_reset();
