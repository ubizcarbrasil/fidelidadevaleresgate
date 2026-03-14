
-- Error logs table for lightweight error tracking
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  message text NOT NULL,
  stack text,
  url text,
  user_id uuid,
  brand_id uuid,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'error',
  source text NOT NULL DEFAULT 'client'
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert errors
CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only root_admin can read all error logs
CREATE POLICY "Root admins can read error logs"
  ON public.error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin'));

-- Anon can insert too (for pre-auth errors)
CREATE POLICY "Anon can insert error logs"
  ON public.error_logs FOR INSERT TO anon
  WITH CHECK (true);

-- Index for querying recent errors
CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_brand_id ON public.error_logs (brand_id) WHERE brand_id IS NOT NULL;
