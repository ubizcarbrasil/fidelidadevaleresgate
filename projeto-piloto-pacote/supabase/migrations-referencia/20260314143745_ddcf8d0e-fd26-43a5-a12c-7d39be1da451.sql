
-- Add telegram_chat_id to machine_integrations
ALTER TABLE public.machine_integrations ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT NULL;

-- Create machine_ride_notifications table
CREATE TABLE IF NOT EXISTS public.machine_ride_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id),
  branch_id UUID REFERENCES public.branches(id),
  machine_ride_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_cpf_masked TEXT,
  city_name TEXT,
  points_credited INTEGER NOT NULL DEFAULT 0,
  ride_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.machine_ride_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand members can read notifications"
ON public.machine_ride_notifications FOR SELECT TO authenticated
USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- Service role can insert (from edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.machine_ride_notifications FOR INSERT TO service_role
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_ride_notifications;
