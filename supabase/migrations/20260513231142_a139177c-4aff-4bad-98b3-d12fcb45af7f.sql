BEGIN;

DELETE FROM public.brand_business_models
WHERE business_model_id = 'ae433bd3-aed7-4c3d-b2bd-d8d6ee5e8d0f'
  AND id IN (
    '65a26691-23c8-44e3-810a-e0686ef85896',
    '961dc7c6-cdf6-43f5-922f-f754aead64e2',
    'd492017c-e6f9-4830-8028-0c43e3f4ba14',
    'f9c7e149-3ed4-4402-b17c-fe88f4e35680'
  );

DO $$ BEGIN
  IF (SELECT COUNT(*) FROM public.brand_business_models
      WHERE business_model_id = 'ae433bd3-aed7-4c3d-b2bd-d8d6ee5e8d0f') > 0 THEN
    RAISE EXCEPTION 'Ainda existem linhas apontando para campeonato_motorista BM — abortando.';
  END IF;
END $$;

DELETE FROM public.brand_modules
WHERE module_definition_id = 'd93252cb-d52d-4119-913c-46c7d39db1c2'
  AND id IN (
    '678c17c6-8bc5-4945-80d7-f5572bc88673',
    '4eca0229-ea2d-4df4-b8bf-2884fa328846',
    'eaba63f1-1765-46c0-a500-98605577fce8',
    '33215b7e-d063-4f8d-a2f8-c1b80e450a0d'
  );

DELETE FROM public.module_definitions
WHERE id = 'd93252cb-d52d-4119-913c-46c7d39db1c2'
  AND key = 'campeonato_motorista';

DELETE FROM public.business_models
WHERE id = 'ae433bd3-aed7-4c3d-b2bd-d8d6ee5e8d0f'
  AND key = 'campeonato_motorista';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.business_models WHERE id = 'ae433bd3-aed7-4c3d-b2bd-d8d6ee5e8d0f') THEN
    RAISE EXCEPTION 'business_model campeonato_motorista ainda existe — abortando.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.module_definitions WHERE id = 'd93252cb-d52d-4119-913c-46c7d39db1c2') THEN
    RAISE EXCEPTION 'module_definition campeonato_motorista ainda existe — abortando.';
  END IF;
END $$;

COMMIT;