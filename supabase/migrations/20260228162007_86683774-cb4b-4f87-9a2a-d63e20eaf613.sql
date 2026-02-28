
-- Trigger: auto-assign 'customer' role in user_roles when a customer record is created with user_id
CREATE OR REPLACE FUNCTION public.auto_assign_customer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'customer')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_customer_role
AFTER INSERT ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_customer_role();
