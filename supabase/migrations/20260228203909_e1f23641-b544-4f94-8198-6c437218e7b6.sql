
-- Add store_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_admin';

-- Create trigger function to auto-assign store_admin role when store is approved
CREATE OR REPLACE FUNCTION public.auto_assign_store_admin_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when approval_status changes to APPROVED
  IF NEW.approval_status = 'APPROVED' AND (OLD.approval_status IS DISTINCT FROM 'APPROVED') AND NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_user_id, 'store_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on stores table
CREATE TRIGGER trg_auto_assign_store_admin
AFTER UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_store_admin_on_approval();
