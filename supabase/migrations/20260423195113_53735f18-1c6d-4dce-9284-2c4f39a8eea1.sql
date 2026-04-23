-- Sprint 1 / Tarefa 1: ADD COLUMN config_json em city_business_model_overrides
-- Aditivo, reversível. Default '{}'.
-- Rollback: ALTER TABLE public.city_business_model_overrides DROP COLUMN config_json;

ALTER TABLE public.city_business_model_overrides
  ADD COLUMN IF NOT EXISTS config_json jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.city_business_model_overrides.config_json IS
  'Sprint 1: overrides de configuração por cidade (features/flags) sobre brand_business_models.config_json. Default {} = herda da marca.';