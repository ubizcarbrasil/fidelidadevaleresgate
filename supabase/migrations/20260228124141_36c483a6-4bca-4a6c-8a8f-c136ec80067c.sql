
-- 6. Create user_permission_overrides
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('PLATFORM','TENANT','BRAND','BRANCH')),
  scope_id uuid,
  is_allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index: with scope_id
CREATE UNIQUE INDEX IF NOT EXISTS upo_user_perm_scope_idx
  ON public.user_permission_overrides (user_id, permission_key, scope_type, scope_id)
  WHERE scope_id IS NOT NULL;

-- Unique index: without scope_id (PLATFORM level)
CREATE UNIQUE INDEX IF NOT EXISTS upo_user_perm_scope_null_idx
  ON public.user_permission_overrides (user_id, permission_key, scope_type)
  WHERE scope_id IS NULL;

ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overrides"
  ON public.user_permission_overrides FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Root admins can manage all overrides"
  ON public.user_permission_overrides FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role));

-- 10. Helper function: check permission with scope
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id uuid,
  _permission_key text,
  _scope_type text DEFAULT 'PLATFORM',
  _scope_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_denied boolean;
  _is_allowed boolean;
BEGIN
  IF has_role(_user_id, 'root_admin'::app_role) THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_permission_overrides
    WHERE user_id = _user_id
      AND permission_key = _permission_key
      AND scope_type = _scope_type
      AND (scope_id = _scope_id OR scope_id IS NULL)
      AND is_allowed = false
  ) INTO _is_denied;

  IF _is_denied THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_permission_overrides
    WHERE user_id = _user_id
      AND permission_key = _permission_key
      AND scope_type = _scope_type
      AND (scope_id = _scope_id OR scope_id IS NULL)
      AND is_allowed = true
  ) INTO _is_allowed;

  IF _is_allowed THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.name = ur.role::text
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.key = _permission_key
  );
END;
$$;
