-- ============================================================
-- Limpeza brand_duelo_prizes v1 vs v2
-- v1 está vazia e sem referências; v2 herda o nome canônico
-- ============================================================

-- 1. Drop da tabela v1 (vazia, sem referências em código/FK/RPC)
DROP TABLE IF EXISTS public.brand_duelo_prizes CASCADE;

-- 2. Renomear a tabela v2 para o nome canônico
ALTER TABLE public.brand_duelo_prizes_v2 RENAME TO brand_duelo_prizes;

-- 3. Renomear constraint UNIQUE (renomeia índice associado em cascata)
ALTER TABLE public.brand_duelo_prizes
  RENAME CONSTRAINT brand_duelo_prizes_v2_brand_id_branch_id_tier_name_position_key
  TO brand_duelo_prizes_brand_id_branch_id_tier_name_position_key;

-- 4. Renomear primary key
ALTER INDEX public.brand_duelo_prizes_v2_pkey
  RENAME TO brand_duelo_prizes_pkey;

-- 5. Renomear o índice auxiliar de brand_id
ALTER INDEX public.idx_brand_duelo_prizes_v2_brand
  RENAME TO idx_brand_duelo_prizes_brand;

-- 6. Renomear o trigger de updated_at
ALTER TRIGGER trg_brand_duelo_prizes_v2_updated_at
  ON public.brand_duelo_prizes
  RENAME TO trg_brand_duelo_prizes_updated_at;

-- 7. Renomear as 3 policies removendo o sufixo _v2
ALTER POLICY brand_duelo_prizes_v2_root_all
  ON public.brand_duelo_prizes
  RENAME TO brand_duelo_prizes_root_all;

ALTER POLICY brand_duelo_prizes_v2_brand_admin_all
  ON public.brand_duelo_prizes
  RENAME TO brand_duelo_prizes_brand_admin_all;

ALTER POLICY brand_duelo_prizes_v2_branch_admin_select
  ON public.brand_duelo_prizes
  RENAME TO brand_duelo_prizes_branch_admin_select;

-- ============================================================
-- ROLLBACK (documentado para emergências)
-- ============================================================
-- ALTER POLICY brand_duelo_prizes_branch_admin_select ON public.brand_duelo_prizes RENAME TO brand_duelo_prizes_v2_branch_admin_select;
-- ALTER POLICY brand_duelo_prizes_brand_admin_all ON public.brand_duelo_prizes RENAME TO brand_duelo_prizes_v2_brand_admin_all;
-- ALTER POLICY brand_duelo_prizes_root_all ON public.brand_duelo_prizes RENAME TO brand_duelo_prizes_v2_root_all;
-- ALTER TRIGGER trg_brand_duelo_prizes_updated_at ON public.brand_duelo_prizes RENAME TO trg_brand_duelo_prizes_v2_updated_at;
-- ALTER INDEX public.idx_brand_duelo_prizes_brand RENAME TO idx_brand_duelo_prizes_v2_brand;
-- ALTER INDEX public.brand_duelo_prizes_pkey RENAME TO brand_duelo_prizes_v2_pkey;
-- ALTER TABLE public.brand_duelo_prizes RENAME CONSTRAINT brand_duelo_prizes_brand_id_branch_id_tier_name_position_key TO brand_duelo_prizes_v2_brand_id_branch_id_tier_name_position_key;
-- ALTER TABLE public.brand_duelo_prizes RENAME TO brand_duelo_prizes_v2;
-- (recriar v1 a partir da migration 20260421194253 se necessário)