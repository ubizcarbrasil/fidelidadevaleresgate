-- Add geolocation columns to branches for proximity detection
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Allow anonymous/public read of branches for white-label resolution (unauthenticated users)
CREATE POLICY "Anyone can read active branches for white-label"
ON public.branches
FOR SELECT
USING (is_active = true);