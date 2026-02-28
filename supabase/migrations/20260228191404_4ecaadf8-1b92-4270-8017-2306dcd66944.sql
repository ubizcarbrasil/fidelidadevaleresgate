
-- Change token default from hex to 6-digit numeric PIN
ALTER TABLE public.redemptions
  ALTER COLUMN token SET DEFAULT lpad(floor(random() * 1000000)::text, 6, '0');

-- Add customer_cpf column for mandatory CPF on redemption
ALTER TABLE public.redemptions
  ADD COLUMN customer_cpf text;

-- Create function to generate unique 6-digit PIN per pending redemption
CREATE OR REPLACE FUNCTION public.generate_redemption_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_pin text;
  attempts int := 0;
BEGIN
  LOOP
    new_pin := lpad(floor(random() * 1000000)::text, 6, '0');
    -- Check uniqueness among PENDING redemptions only
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.redemptions
      WHERE token = new_pin AND status = 'PENDING'
    );
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique PIN after 100 attempts';
    END IF;
  END LOOP;
  NEW.token := new_pin;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate PIN on insert
CREATE TRIGGER trg_generate_redemption_pin
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_redemption_pin();
