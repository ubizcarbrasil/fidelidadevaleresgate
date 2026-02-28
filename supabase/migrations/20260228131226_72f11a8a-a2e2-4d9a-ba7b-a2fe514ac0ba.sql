
-- Step 1: Add missing enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operator_pdv';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- Step 2: Add scope fields to profiles (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Step 3: Create roles table
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read roles" ON public.roles FOR SELECT TO authenticated USING (true);

-- Step 4: Create permissions table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);

-- Step 5: Create role_permissions pivot
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Step 6: Seed roles
INSERT INTO public.roles (name, description, is_system) VALUES
  ('root_admin', 'Administrador da plataforma', true),
  ('tenant_admin', 'Administrador do tenant', true),
  ('brand_admin', 'Administrador da marca', true),
  ('branch_admin', 'Administrador da filial', true),
  ('branch_operator', 'Operador de PDV', true),
  ('operator_pdv', 'Operador de ponto de venda', true),
  ('store_admin', 'Lojista administrador', true),
  ('customer', 'Cliente final', true);

-- Step 7: Seed permissions
INSERT INTO public.permissions (key, description, module) VALUES
  ('tenants.create', 'Criar tenants', 'tenants'),
  ('tenants.read', 'Visualizar tenants', 'tenants'),
  ('tenants.update', 'Editar tenants', 'tenants'),
  ('tenants.delete', 'Excluir tenants', 'tenants'),
  ('brands.create', 'Criar brands', 'brands'),
  ('brands.read', 'Visualizar brands', 'brands'),
  ('brands.update', 'Editar brands', 'brands'),
  ('brands.delete', 'Excluir brands', 'brands'),
  ('branches.create', 'Criar branches', 'branches'),
  ('branches.read', 'Visualizar branches', 'branches'),
  ('branches.update', 'Editar branches', 'branches'),
  ('branches.delete', 'Excluir branches', 'branches'),
  ('vouchers.create', 'Criar vouchers', 'vouchers'),
  ('vouchers.read', 'Visualizar vouchers', 'vouchers'),
  ('vouchers.update', 'Editar vouchers', 'vouchers'),
  ('vouchers.delete', 'Excluir vouchers', 'vouchers'),
  ('vouchers.redeem', 'Resgatar vouchers', 'vouchers'),
  ('vouchers.cancel', 'Cancelar vouchers', 'vouchers'),
  ('users.create', 'Criar usuários', 'users'),
  ('users.read', 'Visualizar usuários', 'users'),
  ('users.update', 'Editar usuários', 'users'),
  ('users.delete', 'Excluir usuários', 'users'),
  ('users.invite', 'Convidar usuários', 'users'),
  ('users.deactivate', 'Desativar usuários', 'users'),
  ('roles.read', 'Visualizar roles', 'roles'),
  ('roles.assign', 'Atribuir roles', 'roles'),
  ('roles.revoke', 'Revogar roles', 'roles'),
  ('domains.create', 'Criar domínios', 'domains'),
  ('domains.read', 'Visualizar domínios', 'domains'),
  ('domains.update', 'Editar domínios', 'domains'),
  ('domains.delete', 'Excluir domínios', 'domains'),
  ('reports.view', 'Visualizar relatórios', 'reports'),
  ('settings.read', 'Visualizar configurações', 'settings'),
  ('settings.update', 'Editar configurações', 'settings');

-- Step 8: Seed role_permissions
-- root_admin: ALL
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p WHERE r.name = 'root_admin';

-- tenant_admin: all except tenants.create/delete
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'tenant_admin' AND p.key NOT IN ('tenants.create', 'tenants.delete');

-- brand_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'brand_admin' AND (p.module IN ('brands', 'branches', 'vouchers', 'domains', 'reports', 'settings') OR p.key IN ('users.read', 'users.invite', 'roles.read'));

-- branch_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'branch_admin' AND (p.key IN ('branches.read', 'branches.update', 'users.read', 'reports.view', 'settings.read', 'roles.read') OR p.module = 'vouchers');

-- operator_pdv & branch_operator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('operator_pdv', 'branch_operator') AND p.key IN ('vouchers.read', 'vouchers.redeem', 'branches.read');

-- store_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'store_admin' AND p.key IN ('vouchers.read', 'vouchers.create', 'vouchers.update', 'branches.read', 'reports.view');

-- customer
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'customer' AND p.key = 'vouchers.read';

-- Step 9: Recreate user_has_permission to use new tables
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
  IF has_role(_user_id, 'root_admin'::app_role) THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_permission_overrides
    WHERE user_id = _user_id AND permission_key = _permission_key
      AND scope_type = _scope_type AND (scope_id = _scope_id OR scope_id IS NULL)
      AND is_allowed = false
  ) INTO _is_denied;
  IF _is_denied THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_permission_overrides
    WHERE user_id = _user_id AND permission_key = _permission_key
      AND scope_type = _scope_type AND (scope_id = _scope_id OR scope_id IS NULL)
      AND is_allowed = true
  ) INTO _is_allowed;
  IF _is_allowed THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.name = ur.role::text
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.key = _permission_key
  );
END;
$$;
