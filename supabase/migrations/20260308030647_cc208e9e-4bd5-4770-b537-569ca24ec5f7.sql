
-- Rate limiting table for edge functions
CREATE TABLE public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count int NOT NULL DEFAULT 1,
  UNIQUE(key, window_start)
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_key_window ON public.rate_limit_entries (key, window_start);

-- Cleanup function to remove old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.rate_limit_cleanup()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limit_entries
  WHERE window_start < now() - interval '1 hour';
$$;

-- No RLS needed - this table is only accessed from edge functions via SERVICE_ROLE
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
