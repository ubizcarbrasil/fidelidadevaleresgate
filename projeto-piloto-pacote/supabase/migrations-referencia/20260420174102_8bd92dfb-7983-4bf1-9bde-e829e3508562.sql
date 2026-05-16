CREATE TABLE IF NOT EXISTS public.driver_profiles (
  customer_id uuid PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,

  external_id text,
  gender text,
  birth_date date,
  mother_name text,

  cnh_number text,
  cnh_expiration date,
  has_ear boolean,

  rating numeric(3,2),
  acceptance_rate integer,
  acceptance_rate_updated_at timestamptz,

  registration_status text,
  registration_status_at timestamptz,
  registered_at timestamptz,
  blocked_until timestamptz,
  block_reason text,
  last_os_at timestamptz,
  last_activity_at timestamptz,

  accepted_payments jsonb DEFAULT '{}'::jsonb,
  services_offered jsonb DEFAULT '{}'::jsonb,

  link_type text,
  relationship text,

  vehicle1_model text,
  vehicle1_year integer,
  vehicle1_color text,
  vehicle1_plate text,
  vehicle1_state text,
  vehicle1_city text,
  vehicle1_renavam text,
  vehicle1_own boolean,
  vehicle1_exercise_year integer,

  vehicle2_model text,
  vehicle2_year integer,
  vehicle2_color text,
  vehicle2_plate text,
  vehicle2_state text,
  vehicle2_city text,
  vehicle2_renavam text,
  vehicle2_own boolean,
  vehicle2_exercise_year integer,

  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zipcode text,

  bank_holder_cpf text,
  bank_holder_name text,
  bank_code text,
  bank_agency text,
  bank_account text,
  pix_key text,

  extra_data text,
  internal_note_1 text,
  internal_note_2 text,
  internal_note_3 text,

  imei_1 text,
  imei_2 text,
  vtr text,
  app_version text,

  referred_by text,

  fees_json jsonb DEFAULT '{}'::jsonb,

  raw_import_json jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_brand_id ON public.driver_profiles(brand_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_branch_id ON public.driver_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_external_id ON public.driver_profiles(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_driver_profiles_cnh ON public.driver_profiles(cnh_number) WHERE cnh_number IS NOT NULL;

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins can manage driver_profiles"
ON public.driver_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_profiles.brand_id
      AND ur.role IN ('brand_admin'::app_role, 'root_admin'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_profiles.brand_id
      AND ur.role IN ('brand_admin'::app_role, 'root_admin'::app_role)
  )
);

CREATE POLICY "Branch admins can manage own city driver_profiles"
ON public.driver_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_profiles.brand_id
      AND ur.branch_id = driver_profiles.branch_id
      AND ur.role = 'branch_admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_profiles.brand_id
      AND ur.branch_id = driver_profiles.branch_id
      AND ur.role = 'branch_admin'::app_role
  )
);

CREATE OR REPLACE FUNCTION public.tg_driver_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_driver_profiles_updated_at
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_driver_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.tg_sync_driver_profile_branch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN
    UPDATE public.driver_profiles
       SET branch_id = NEW.branch_id
     WHERE customer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_driver_profile_branch ON public.customers;
CREATE TRIGGER trg_sync_driver_profile_branch
AFTER UPDATE OF branch_id ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_driver_profile_branch();

CREATE TABLE IF NOT EXISTS public.driver_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by uuid,
  status text NOT NULL DEFAULT 'pending',
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_import_jobs_brand ON public.driver_import_jobs(brand_id, created_at DESC);

ALTER TABLE public.driver_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand admins manage import jobs"
ON public.driver_import_jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_import_jobs.brand_id
      AND ur.role IN ('brand_admin'::app_role, 'root_admin'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_import_jobs.brand_id
      AND ur.role IN ('brand_admin'::app_role, 'root_admin'::app_role)
  )
);

CREATE POLICY "Branch admins manage own city import jobs"
ON public.driver_import_jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_import_jobs.brand_id
      AND ur.branch_id = driver_import_jobs.branch_id
      AND ur.role = 'branch_admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.brand_id = driver_import_jobs.brand_id
      AND ur.branch_id = driver_import_jobs.branch_id
      AND ur.role = 'branch_admin'::app_role
  )
);
