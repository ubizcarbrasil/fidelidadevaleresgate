
-- Add unique constraint for upsert on machine_rides
ALTER TABLE public.machine_rides ADD CONSTRAINT machine_rides_brand_ride_unique UNIQUE (brand_id, machine_ride_id);
