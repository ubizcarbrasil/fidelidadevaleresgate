
-- Auto-assign root_admin to the first user ever registered
CREATE OR REPLACE FUNCTION public.auto_assign_root_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only assign if no root_admin exists yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'root_admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'root_admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Fire after the profile is created (which happens on signup via handle_new_user)
CREATE TRIGGER on_first_user_assign_root_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_root_admin();
