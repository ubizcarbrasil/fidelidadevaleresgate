
-- Add email column to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;

-- Add driver_name to machine_rides
ALTER TABLE public.machine_rides ADD COLUMN IF NOT EXISTS driver_name text;

-- Add driver_name to machine_ride_notifications
ALTER TABLE public.machine_ride_notifications ADD COLUMN IF NOT EXISTS driver_name text;
