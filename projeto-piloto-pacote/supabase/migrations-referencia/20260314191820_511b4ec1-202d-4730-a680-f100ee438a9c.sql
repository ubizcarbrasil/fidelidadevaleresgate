
-- Add missing columns to machine_rides
ALTER TABLE public.machine_rides ADD COLUMN IF NOT EXISTS passenger_name text;
ALTER TABLE public.machine_rides ADD COLUMN IF NOT EXISTS passenger_phone text;

-- Add customer_id to machine_ride_notifications
ALTER TABLE public.machine_ride_notifications ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);
