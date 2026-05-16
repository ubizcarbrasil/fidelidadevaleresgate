ALTER TABLE public.machine_integrations
  ADD COLUMN IF NOT EXISTS driver_points_mode text NOT NULL DEFAULT 'PERCENT',
  ADD COLUMN IF NOT EXISTS driver_points_per_real numeric NOT NULL DEFAULT 1;