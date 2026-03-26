
-- Add driver points columns to machine_integrations
ALTER TABLE public.machine_integrations
  ADD COLUMN IF NOT EXISTS driver_points_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_points_percent numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS driver_customer_tag text NOT NULL DEFAULT 'MOTORISTA';

-- Add driver columns to machine_rides
ALTER TABLE public.machine_rides
  ADD COLUMN IF NOT EXISTS driver_points_credited integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_customer_id uuid,
  ADD COLUMN IF NOT EXISTS driver_id text;
