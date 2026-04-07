-- Add matrix credentials to brands table (one config per entrepreneur)
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS matrix_api_key text,
  ADD COLUMN IF NOT EXISTS matrix_basic_auth_user text,
  ADD COLUMN IF NOT EXISTS matrix_basic_auth_password text;

-- Migrate existing matrix credentials from machine_integrations to brands
UPDATE public.brands b
SET
  matrix_api_key = mi.matrix_api_key,
  matrix_basic_auth_user = mi.matrix_basic_auth_user,
  matrix_basic_auth_password = mi.matrix_basic_auth_password
FROM (
  SELECT DISTINCT ON (brand_id) brand_id, matrix_api_key, matrix_basic_auth_user, matrix_basic_auth_password
  FROM public.machine_integrations
  WHERE matrix_api_key IS NOT NULL AND matrix_api_key != ''
  ORDER BY brand_id, created_at ASC
) mi
WHERE b.id = mi.brand_id
  AND b.matrix_api_key IS NULL;