
-- Create machine_integrations table
CREATE TABLE public.machine_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  basic_auth_user TEXT NOT NULL DEFAULT '',
  basic_auth_password TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_rides INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_webhook_at TIMESTAMPTZ,
  last_ride_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create machine_rides table
CREATE TABLE public.machine_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  machine_ride_id TEXT NOT NULL,
  passenger_cpf TEXT,
  ride_value NUMERIC NOT NULL DEFAULT 0,
  ride_status TEXT NOT NULL DEFAULT 'PENDING',
  points_credited INTEGER NOT NULL DEFAULT 0,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, machine_ride_id)
);

-- RLS
ALTER TABLE public.machine_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_rides ENABLE ROW LEVEL SECURITY;

-- Policies for machine_integrations (brand admins can read their own)
CREATE POLICY "Users can view their brand integrations"
  ON public.machine_integrations FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

CREATE POLICY "Users can manage their brand integrations"
  ON public.machine_integrations FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())))
  WITH CHECK (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- Policies for machine_rides (brand admins can read their own)
CREATE POLICY "Users can view their brand rides"
  ON public.machine_rides FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));
