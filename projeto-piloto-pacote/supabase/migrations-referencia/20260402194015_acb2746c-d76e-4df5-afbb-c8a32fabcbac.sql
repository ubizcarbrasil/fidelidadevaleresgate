ALTER TABLE public.machine_integrations
ADD COLUMN driver_message_enabled boolean NOT NULL DEFAULT false;