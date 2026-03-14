
-- Create machine_ride_events table for real-time ride tracking
CREATE TABLE public.machine_ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  machine_ride_id TEXT NOT NULL,
  status_code TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying events by ride
CREATE INDEX idx_machine_ride_events_ride ON public.machine_ride_events (brand_id, machine_ride_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.machine_ride_events ENABLE ROW LEVEL SECURITY;

-- RLS: service_role full access (webhook uses service_role)
CREATE POLICY "service_role_full_access" ON public.machine_ride_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS: brand users can read events of their brand
CREATE POLICY "brand_users_read" ON public.machine_ride_events
  FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_ride_events;
