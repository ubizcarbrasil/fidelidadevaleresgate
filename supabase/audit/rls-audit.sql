-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Audit — fidelidadevaleresgate
--
-- USO:
--   Cole este script no SQL Editor do Supabase (Dashboard) e rode tudo.
--   Cada bloco retorna uma seção do relatório:
--     1. Tabelas sem RLS ativado
--     2. Tabelas com RLS ativado mas sem políticas (deny-all)
--     3. Cobertura por comando (SELECT/INSERT/UPDATE/DELETE) das tabelas críticas
--     4. Políticas que NÃO filtram por brand_id/tenant_id (potencial leak)
--     5. Tabelas com dados sensíveis (PII/financeiro) e sua cobertura
--
-- POR QUÊ:
--   Migrations dão pista do que foi feito; só o estado live em pg_policies
--   diz a verdade (uma migration posterior pode ter dropado uma política).
--   Esta é a fonte de verdade pro audit B3.1.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabelas SEM RLS ativado ──────────────────────────────────────────────
SELECT
  '1_TABELAS_SEM_RLS' AS secao,
  t.schemaname,
  t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = t.schemaname
      AND c.relname = t.tablename
      AND c.relrowsecurity = true
  )
ORDER BY t.tablename;

-- ── 2. Tabelas com RLS mas SEM políticas (deny-all efetivo) ─────────────────
SELECT
  '2_RLS_SEM_POLICIES' AS secao,
  c.relname AS tablename,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS tamanho
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = n.nspname
      AND p.tablename = c.relname
  )
ORDER BY c.relname;

-- ── 3. Cobertura por comando das tabelas críticas ──────────────────────────
-- (tabelas com dados financeiros, PII ou multi-tenant críticos)
WITH critical_tables AS (
  SELECT unnest(ARRAY[
    'customers', 'points_ledger', 'redemptions', 'earning_events',
    'brands', 'branches', 'stores', 'offers',
    'machine_rides', 'machine_integrations', 'machine_ride_events',
    'driver_profiles', 'driver_documents',
    'user_roles', 'audit_logs', 'profiles',
    'branch_points_wallet', 'branch_wallet_transactions',
    'points_packages', 'points_package_orders',
    'voucher_redemptions', 'brand_modules', 'brand_settings',
    'cp_contacts', 'store_employees', 'store_products', 'store_reviews',
    'affiliate_deals'
  ]) AS tablename
)
SELECT
  '3_COBERTURA_CRITICAS' AS secao,
  ct.tablename,
  COUNT(*) FILTER (WHERE p.cmd = 'SELECT' OR p.cmd = 'ALL') AS select_pols,
  COUNT(*) FILTER (WHERE p.cmd = 'INSERT' OR p.cmd = 'ALL') AS insert_pols,
  COUNT(*) FILTER (WHERE p.cmd = 'UPDATE' OR p.cmd = 'ALL') AS update_pols,
  COUNT(*) FILTER (WHERE p.cmd = 'DELETE' OR p.cmd = 'ALL') AS delete_pols,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=ct.tablename)
      THEN 'TABELA_NAO_EXISTE'
    WHEN COUNT(p.*) = 0 THEN 'DENY_ALL'
    WHEN COUNT(*) FILTER (WHERE p.cmd = 'SELECT' OR p.cmd = 'ALL') = 0 THEN 'SEM_SELECT'
    WHEN COUNT(*) FILTER (WHERE p.cmd = 'INSERT' OR p.cmd = 'ALL') = 0 THEN 'SEM_INSERT'
    WHEN COUNT(*) FILTER (WHERE p.cmd = 'UPDATE' OR p.cmd = 'ALL') = 0 THEN 'SEM_UPDATE'
    WHEN COUNT(*) FILTER (WHERE p.cmd = 'DELETE' OR p.cmd = 'ALL') = 0 THEN 'SEM_DELETE'
    ELSE 'OK'
  END AS status
FROM critical_tables ct
LEFT JOIN pg_policies p
  ON p.schemaname = 'public' AND p.tablename = ct.tablename
GROUP BY ct.tablename
ORDER BY status DESC, ct.tablename;

-- ── 4. Políticas que NÃO mencionam brand_id/tenant_id ───────────────────────
-- (suspeita de leak cross-tenant; pode ser legítimo pra tabelas globais)
SELECT
  '4_POLICIES_SEM_TENANT_FILTER' AS secao,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN tablename IN ('platform_config','feature_flags','audit_logs') THEN 'GLOBAL_OK'
    ELSE 'REVISAR'
  END AS classificacao
FROM pg_policies
WHERE schemaname = 'public'
  AND COALESCE(qual, '') !~* '(brand_id|tenant_id|user_id|auth\.uid)'
  AND COALESCE(with_check, '') !~* '(brand_id|tenant_id|user_id|auth\.uid)'
ORDER BY classificacao, tablename, policyname;

-- ── 5. Listagem completa de políticas por tabela ────────────────────────────
-- (útil pra audit manual; copia o resultado pra issue/PR)
SELECT
  '5_INVENTARIO' AS secao,
  schemaname || '.' || tablename AS tabela,
  policyname,
  cmd,
  permissive,
  roles,
  LEFT(COALESCE(qual, ''), 80) AS using_clause,
  LEFT(COALESCE(with_check, ''), 80) AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
