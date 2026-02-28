
-- Trigger to auto-set expires_at on redemption insert (default 24h)
CREATE OR REPLACE FUNCTION public.set_redemption_expires_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Default 24 hours expiration if not set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '24 hours';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_set_redemption_expires_at
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_redemption_expires_at();

-- Add index for faster PIN lookups
CREATE INDEX IF NOT EXISTS idx_redemptions_token_status ON public.redemptions (token, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_status_expires ON public.redemptions (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_offers_store_status ON public.offers (store_id, status, is_active);
