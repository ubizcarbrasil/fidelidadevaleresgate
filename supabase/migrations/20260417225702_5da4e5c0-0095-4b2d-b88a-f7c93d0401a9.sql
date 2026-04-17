-- 1) Backup explícito (rollback fácil)
CREATE TABLE public.module_definitions_backup_pre_norm AS
SELECT * FROM public.module_definitions;

-- 2) Mapeamento direto (categorias antigas → novas)
UPDATE public.module_definitions SET category = 'essencial'          WHERE category = 'core';
UPDATE public.module_definitions SET category = 'governanca'         WHERE category IN ('governance','settings');
UPDATE public.module_definitions SET category = 'personalizacao'     WHERE category IN ('visual','visual_theme');
UPDATE public.module_definitions SET category = 'inteligencia_dados' WHERE category = 'dados';
UPDATE public.module_definitions SET category = 'fidelidade_pontos'  WHERE category = 'fidelidade';
-- comercial, engajamento, integracoes ficam iguais

-- 3) Redistribuição do 'general' (6 keys)
UPDATE public.module_definitions SET category = 'engajamento'        WHERE key = 'achadinhos_motorista';
UPDATE public.module_definitions SET category = 'comercial'          WHERE key = 'categories';
UPDATE public.module_definitions SET category = 'inteligencia_dados' WHERE key = 'brand_settings';
UPDATE public.module_definitions SET category = 'personalizacao'     WHERE key = 'driver_hub';
UPDATE public.module_definitions SET category = 'inteligencia_dados' WHERE key = 'csv_import';
UPDATE public.module_definitions SET category = 'integracoes'        WHERE key = 'api_keys';

-- 4) Default + CHECK constraint (proteção futura)
ALTER TABLE public.module_definitions ALTER COLUMN category SET DEFAULT 'essencial';
ALTER TABLE public.module_definitions
  ADD CONSTRAINT module_definitions_category_check
  CHECK (category IN ('essencial','comercial','fidelidade_pontos','engajamento',
                      'personalizacao','governanca','inteligencia_dados','integracoes'));

-- 5) Validação inline — aborta tudo se contagens não baterem
DO $$
DECLARE
  total INT;
  soma INT;
  nulos INT;
BEGIN
  SELECT count(*) INTO total FROM public.module_definitions;
  SELECT count(*) INTO soma  FROM public.module_definitions
    WHERE category IN ('essencial','comercial','fidelidade_pontos','engajamento',
                       'personalizacao','governanca','inteligencia_dados','integracoes');
  SELECT count(*) INTO nulos FROM public.module_definitions WHERE category IS NULL;

  IF total <> 57 THEN
    RAISE EXCEPTION 'Validação falhou: total esperado=57, encontrado=%', total;
  END IF;
  IF soma <> total THEN
    RAISE EXCEPTION 'Validação falhou: % módulos fora das 8 categorias válidas', (total - soma);
  END IF;
  IF nulos > 0 THEN
    RAISE EXCEPTION 'Validação falhou: % módulos com category NULL', nulos;
  END IF;

  RAISE NOTICE 'Validação OK: % módulos distribuídos em 8 categorias', total;
END$$;