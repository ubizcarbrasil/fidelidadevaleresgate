-- Sprint 1 / Tarefa 2: ADD COLUMN GENERATED is_driver em customers + índice parcial
-- Aditivo, reversível. Coluna STORED calculada de external_driver_id e name.
-- Rollback:
--   DROP INDEX IF EXISTS public.idx_customers_is_driver;
--   ALTER TABLE public.customers DROP COLUMN is_driver;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS is_driver boolean
  GENERATED ALWAYS AS (
    external_driver_id IS NOT NULL
    OR name ILIKE '%[MOTORISTA]%'
  ) STORED;

COMMENT ON COLUMN public.customers.is_driver IS
  'Sprint 1: flag derivado (STORED). TRUE quando há external_driver_id OU nome contém [MOTORISTA]. Imutável em relação às colunas-fonte.';

CREATE INDEX IF NOT EXISTS idx_customers_is_driver
  ON public.customers (brand_id, branch_id)
  WHERE is_driver = true;