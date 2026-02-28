
-- Fix ALL RLS policies to be PERMISSIVE (drop restrictive, recreate permissive)

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Root admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Root admins can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'root_admin'));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Root admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Root admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'root_admin'));

-- TENANTS
DROP POLICY IF EXISTS "Root admins can manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can view own tenant" ON public.tenants;

CREATE POLICY "Root admins can manage tenants" ON public.tenants AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'root_admin'));
CREATE POLICY "Tenant admins can view own tenant" ON public.tenants AS PERMISSIVE FOR SELECT TO authenticated USING (id IN (SELECT public.get_user_tenant_ids(auth.uid())));

-- BRANDS
DROP POLICY IF EXISTS "Root admins can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Tenant admins can manage own brands" ON public.brands;
DROP POLICY IF EXISTS "Brand admins can view own brand" ON public.brands;

CREATE POLICY "Root admins can manage brands" ON public.brands AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'root_admin'));
CREATE POLICY "Tenant admins can manage own brands" ON public.brands AS PERMISSIVE FOR ALL TO authenticated USING (tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid())));
CREATE POLICY "Brand admins can view own brand" ON public.brands AS PERMISSIVE FOR SELECT TO authenticated USING (id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- BRANCHES
DROP POLICY IF EXISTS "Root admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Tenant admins can manage branches in own tenant" ON public.branches;
DROP POLICY IF EXISTS "Brand admins can manage own branches" ON public.branches;
DROP POLICY IF EXISTS "Branch admins can view own branch" ON public.branches;

CREATE POLICY "Root admins can manage branches" ON public.branches AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'root_admin'));
CREATE POLICY "Tenant admins can manage branches in own tenant" ON public.branches AS PERMISSIVE FOR ALL TO authenticated USING (brand_id IN (SELECT b.id FROM public.brands b WHERE b.tenant_id IN (SELECT public.get_user_tenant_ids(auth.uid()))));
CREATE POLICY "Brand admins can manage own branches" ON public.branches AS PERMISSIVE FOR ALL TO authenticated USING (brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));
CREATE POLICY "Branch admins can view own branch" ON public.branches AS PERMISSIVE FOR SELECT TO authenticated USING (id IN (SELECT public.get_user_branch_ids(auth.uid())));
