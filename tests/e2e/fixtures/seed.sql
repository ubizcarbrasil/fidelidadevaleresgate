-- ============================================================================
-- Seed E2E — Módulo Campeonato
-- ============================================================================
-- Idempotente: roda múltiplas vezes sem duplicar (UPSERT por id determinístico).
-- Todo registro tem prefixo "e2e_" no name/slug para que o teardown identifique.
--
-- Pré-requisito: ser executado com SERVICE ROLE (bypass RLS).
-- ============================================================================

BEGIN;

-- Brand de teste (com flag standalone ativada)
INSERT INTO brands (id, name, slug, brand_settings_json)
VALUES (
  '00000000-e2e0-0000-0000-000000000001'::uuid,
  'e2e_E2E Brand',
  'e2e-brand',
  jsonb_build_object('campeonato_standalone_enabled', true)
)
ON CONFLICT (id) DO UPDATE SET
  brand_settings_json = EXCLUDED.brand_settings_json,
  updated_at = now();

-- Branch (cidade) vinculada
INSERT INTO branches (id, brand_id, name, city, state)
VALUES (
  '00000000-e2e0-0000-0000-000000000002'::uuid,
  '00000000-e2e0-0000-0000-000000000001'::uuid,
  'e2e_E2E Branch',
  'Cidade Teste',
  'TS'
)
ON CONFLICT (id) DO NOTHING;

-- Customer-motorista
INSERT INTO customers (id, brand_id, branch_id, name, cpf, points_balance, money_balance)
VALUES (
  '00000000-e2e0-0000-0000-000000000003'::uuid,
  '00000000-e2e0-0000-0000-000000000001'::uuid,
  '00000000-e2e0-0000-0000-000000000002'::uuid,
  '[MOTORISTA] e2e_E2E Test Driver',
  '00000000000',
  500,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cpf = EXCLUDED.cpf;

-- Temporada ativa, fase de classificação
INSERT INTO campeonato_seasons (
  id, brand_id, branch_id, name, year, month, phase,
  classification_starts_at, classification_ends_at,
  knockout_starts_at, knockout_ends_at,
  tiers_count, default_match_hours, published_at
)
VALUES (
  '00000000-e2e0-0000-0000-000000000004'::uuid,
  '00000000-e2e0-0000-0000-000000000001'::uuid,
  '00000000-e2e0-0000-0000-000000000002'::uuid,
  'e2e_Temporada E2E',
  EXTRACT(YEAR FROM now())::int,
  EXTRACT(MONTH FROM now())::int,
  'classification',
  now() - interval '2 days',
  now() + interval '12 days',
  now() + interval '13 days',
  now() + interval '20 days',
  2,
  24,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  phase = 'classification',
  classification_ends_at = now() + interval '12 days',
  updated_at = now();

-- Séries (Tiers) A e B
INSERT INTO campeonato_season_tiers (id, season_id, name, target_size, promote_count, relegate_count, tier_order)
VALUES
  ('00000000-e2e0-0000-0000-000000000005'::uuid,
   '00000000-e2e0-0000-0000-000000000004'::uuid,
   'A', 30, 0, 4, 1),
  ('00000000-e2e0-0000-0000-000000000006'::uuid,
   '00000000-e2e0-0000-0000-000000000004'::uuid,
   'B', 30, 4, 0, 2)
ON CONFLICT (id) DO NOTHING;

-- Vincula motorista E2E à série A
INSERT INTO campeonato_tier_memberships (season_id, tier_id, customer_id)
VALUES (
  '00000000-e2e0-0000-0000-000000000004'::uuid,
  '00000000-e2e0-0000-0000-000000000005'::uuid,
  '00000000-e2e0-0000-0000-000000000003'::uuid
)
ON CONFLICT DO NOTHING;

COMMIT;