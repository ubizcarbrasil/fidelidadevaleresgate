-- Trigger function: log toggle changes on brand_modules into audit_logs
CREATE OR REPLACE FUNCTION public.log_brand_module_toggle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_old_enabled boolean;
  v_new_enabled boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := CASE WHEN NEW.is_enabled THEN 'MODULE_ENABLED' ELSE 'MODULE_DISABLED' END;
    v_old_enabled := NULL;
    v_new_enabled := NEW.is_enabled;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_enabled IS NOT DISTINCT FROM NEW.is_enabled THEN
      RETURN NEW;
    END IF;
    v_action := CASE WHEN NEW.is_enabled THEN 'MODULE_ENABLED' ELSE 'MODULE_DISABLED' END;
    v_old_enabled := OLD.is_enabled;
    v_new_enabled := NEW.is_enabled;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'MODULE_REMOVED';
    v_old_enabled := OLD.is_enabled;
    v_new_enabled := NULL;
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id, action, entity_type, entity_id,
    scope_type, scope_id, changes_json, details_json
  ) VALUES (
    auth.uid(),
    v_action,
    'brand_module',
    COALESCE(NEW.id, OLD.id),
    'brand',
    COALESCE(NEW.brand_id, OLD.brand_id),
    jsonb_build_object('is_enabled', jsonb_build_object('old', v_old_enabled, 'new', v_new_enabled)),
    jsonb_build_object(
      'module_definition_id', COALESCE(NEW.module_definition_id, OLD.module_definition_id),
      'brand_id', COALESCE(NEW.brand_id, OLD.brand_id)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_brand_module_toggle ON public.brand_modules;
CREATE TRIGGER trg_log_brand_module_toggle
AFTER INSERT OR UPDATE OR DELETE ON public.brand_modules
FOR EACH ROW EXECUTE FUNCTION public.log_brand_module_toggle();

-- RLS: allow ROOT admins to read audit logs of brand_module
DROP POLICY IF EXISTS "Root admins can view brand_module audit logs" ON public.audit_logs;
CREATE POLICY "Root admins can view brand_module audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  entity_type = 'brand_module'
  AND public.has_role(auth.uid(), 'root_admin')
);