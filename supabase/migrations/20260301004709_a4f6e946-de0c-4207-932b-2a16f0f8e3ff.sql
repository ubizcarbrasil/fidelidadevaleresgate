-- P1-4: Terms versioning improvements
-- Add terms_params_json to store complete parameters used to generate the term
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS terms_params_json jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add terms_accepted_by_user_id to record who accepted the term
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS terms_accepted_by_user_id uuid NULL;