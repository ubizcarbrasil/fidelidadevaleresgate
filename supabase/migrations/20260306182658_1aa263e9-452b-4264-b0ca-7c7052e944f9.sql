
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'NONE';

COMMENT ON COLUMN public.brands.trial_expires_at IS 'When the 30-day free trial expires. NULL means no trial (legacy/root-provisioned brands).';
COMMENT ON COLUMN public.brands.subscription_status IS 'NONE = no subscription, TRIAL = active trial, ACTIVE = paid, EXPIRED = trial ended without payment';
