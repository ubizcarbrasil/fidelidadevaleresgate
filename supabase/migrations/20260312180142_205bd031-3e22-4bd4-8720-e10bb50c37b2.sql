
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS ride_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_ride_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_ride_at timestamptz;
