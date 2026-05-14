-- ============================================================================
-- Teardown E2E — Módulo Campeonato
-- ============================================================================
-- Remove TODOS os registros criados pelo seed.sql, identificados por:
--   1. UUIDs determinísticos (pattern 00000000-e2e0-...)
--   2. Prefixo "e2e_" no name/slug (defesa em profundidade)
-- ============================================================================

BEGIN;

-- Ordem reversa de dependências
DELETE FROM campeonato_tier_memberships
 WHERE season_id = '00000000-e2e0-0000-0000-000000000004'::uuid;

DELETE FROM campeonato_season_tiers
 WHERE season_id = '00000000-e2e0-0000-0000-000000000004'::uuid;

DELETE FROM campeonato_seasons
 WHERE id = '00000000-e2e0-0000-0000-000000000004'::uuid
    OR name LIKE 'e2e\_%' ESCAPE '\';

DELETE FROM customers
 WHERE id = '00000000-e2e0-0000-0000-000000000003'::uuid
    OR name LIKE '%e2e\_%' ESCAPE '\';

DELETE FROM branches
 WHERE id = '00000000-e2e0-0000-0000-000000000002'::uuid
    OR name LIKE 'e2e\_%' ESCAPE '\';

DELETE FROM brands
 WHERE id = '00000000-e2e0-0000-0000-000000000001'::uuid
    OR slug LIKE 'e2e-%';

COMMIT;