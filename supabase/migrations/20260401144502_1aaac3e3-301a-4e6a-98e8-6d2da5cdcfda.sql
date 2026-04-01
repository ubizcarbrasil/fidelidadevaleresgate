CREATE TABLE public.driver_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_verification_codes ENABLE ROW LEVEL SECURITY;

-- Public read/insert since drivers use CPF login (no Supabase Auth)
CREATE POLICY "Anyone can insert verification codes"
  ON public.driver_verification_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes"
  ON public.driver_verification_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update verification codes"
  ON public.driver_verification_codes
  FOR UPDATE
  USING (true);

-- Index for fast lookup
CREATE INDEX idx_driver_verification_codes_customer ON public.driver_verification_codes (customer_id, used, expires_at DESC);