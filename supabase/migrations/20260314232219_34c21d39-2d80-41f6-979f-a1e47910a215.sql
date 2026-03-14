ALTER TABLE public.machine_integrations
  ADD COLUMN IF NOT EXISTS matrix_api_key text DEFAULT null,
  ADD COLUMN IF NOT EXISTS matrix_basic_auth_user text DEFAULT null,
  ADD COLUMN IF NOT EXISTS matrix_basic_auth_password text DEFAULT null;