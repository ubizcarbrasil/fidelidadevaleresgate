ALTER TABLE public.machine_integrations
  ADD COLUMN IF NOT EXISTS driver_message_frequency TEXT NOT NULL DEFAULT 'EVERY_RIDE',
  ADD COLUMN IF NOT EXISTS driver_message_frequency_value INTEGER DEFAULT NULL;