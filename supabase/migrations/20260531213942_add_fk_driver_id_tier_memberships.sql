-- ============================================================================
-- Adiciona FK driver_id → customers em campeonato_tier_memberships
-- ============================================================================
--
-- Bug detectado em auditoria: campeonato_tier_memberships tinha FK pra
-- season_id e tier_id mas NÃO pra driver_id. Isso permitia:
-- - INSERT de driver_id que não existe em customers (sem validação)
-- - Customer deletado deixava membership órfã (sem cascade)
-- - Inconsistência arquitetural (FK assimétrica)
--
-- Fix: adiciona FK com ON DELETE CASCADE. Antes precisamos limpar órfãos
-- que possam existir (defensivo, idempotente).
-- ============================================================================

-- 1. Limpa órfãos existentes (sem driver válido)
DELETE FROM public.campeonato_tier_memberships m
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c WHERE c.id = m.driver_id
);

-- 2. Adiciona FK constraint (com IF NOT EXISTS via DO block — idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'campeonato_tier_memberships'
      AND constraint_name = 'campeonato_tier_memberships_driver_id_fkey'
  ) THEN
    ALTER TABLE public.campeonato_tier_memberships
      ADD CONSTRAINT campeonato_tier_memberships_driver_id_fkey
      FOREIGN KEY (driver_id)
      REFERENCES public.customers(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Mesma proteção em campeonato_season_standings (mesmo bug arquitetural)
DELETE FROM public.campeonato_season_standings s
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c WHERE c.id = s.driver_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'campeonato_season_standings'
      AND constraint_name = 'campeonato_season_standings_driver_id_fkey'
  ) THEN
    ALTER TABLE public.campeonato_season_standings
      ADD CONSTRAINT campeonato_season_standings_driver_id_fkey
      FOREIGN KEY (driver_id)
      REFERENCES public.customers(id)
      ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON CONSTRAINT campeonato_tier_memberships_driver_id_fkey
  ON public.campeonato_tier_memberships IS
  'FK adicionada em migration 20260531213942 — auditoria detectou órfãos possíveis e ausência de cascade ao deletar customer.';
