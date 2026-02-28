
-- ==================== TENANTS ====================
DROP POLICY IF EXISTS "Root admins can manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can view own tenant" ON public.tenants;

CREATE POLICY "Select tenants" ON public.tenants FOR SELECT TO authenticated
  USING (
    user_has_permission(auth.uid(), 'tenants.read')
    OR id IN (SELECT get_user_tenant_ids(auth.uid()))
  );

CREATE POLICY "Insert tenants" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'tenants.create'));

CREATE POLICY "Update tenants" ON public.tenants FOR UPDATE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'tenants.update')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Delete tenants" ON public.tenants FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'tenants.delete'));

-- ==================== BRANDS ====================
DROP POLICY IF EXISTS "Root admins can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Tenant admins can manage own brands" ON public.brands;
DROP POLICY IF EXISTS "Brand admins can view own brand" ON public.brands;

CREATE POLICY "Select brands" ON public.brands FOR SELECT TO authenticated
  USING (
    user_has_permission(auth.uid(), 'brands.read')
    OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    OR id IN (SELECT get_user_brand_ids(auth.uid()))
  );

CREATE POLICY "Anon read active brands" ON public.brands FOR SELECT USING (is_active = true);

CREATE POLICY "Insert brands" ON public.brands FOR INSERT TO authenticated
  WITH CHECK (
    user_has_permission(auth.uid(), 'brands.create')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

CREATE POLICY "Update brands" ON public.brands FOR UPDATE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'brands.update')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid())) OR id IN (SELECT get_user_brand_ids(auth.uid())))
  );

CREATE POLICY "Delete brands" ON public.brands FOR DELETE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'brands.delete')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
  );

-- ==================== BRANCHES ====================
DROP POLICY IF EXISTS "Root admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Tenant admins can manage branches in own tenant" ON public.branches;
DROP POLICY IF EXISTS "Brand admins can manage own branches" ON public.branches;
DROP POLICY IF EXISTS "Branch admins can view own branch" ON public.branches;
DROP POLICY IF EXISTS "Anyone can read active branches for white-label" ON public.branches;

CREATE POLICY "Select branches" ON public.branches FOR SELECT TO authenticated
  USING (
    user_has_permission(auth.uid(), 'branches.read')
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR id IN (SELECT get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "Anon read active branches" ON public.branches FOR SELECT USING (is_active = true);

CREATE POLICY "Insert branches" ON public.branches FOR INSERT TO authenticated
  WITH CHECK (
    user_has_permission(auth.uid(), 'branches.create')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  );

CREATE POLICY "Update branches" ON public.branches FOR UPDATE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'branches.update')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())) OR id IN (SELECT get_user_branch_ids(auth.uid())))
  );

CREATE POLICY "Delete branches" ON public.branches FOR DELETE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'branches.delete')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  );

-- ==================== VOUCHERS ====================
DROP POLICY IF EXISTS "Root admins can manage all vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Tenant admins can manage vouchers in their tenant" ON public.vouchers;
DROP POLICY IF EXISTS "Brand admins can manage vouchers in their brands" ON public.vouchers;
DROP POLICY IF EXISTS "Branch admins and operators can manage vouchers in their branch" ON public.vouchers;

CREATE POLICY "Select vouchers" ON public.vouchers FOR SELECT TO authenticated
  USING (
    user_has_permission(auth.uid(), 'vouchers.read')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR branch_id IN (SELECT b.id FROM branches b JOIN brands br ON b.brand_id = br.id WHERE br.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR branch_id IN (SELECT b.id FROM branches b WHERE b.brand_id IN (SELECT get_user_brand_ids(auth.uid()))) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
  );

CREATE POLICY "Anon read active vouchers" ON public.vouchers FOR SELECT USING (status = 'active'::voucher_status);

CREATE POLICY "Insert vouchers" ON public.vouchers FOR INSERT TO authenticated
  WITH CHECK (
    user_has_permission(auth.uid(), 'vouchers.create')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR branch_id IN (SELECT b.id FROM branches b JOIN brands br ON b.brand_id = br.id WHERE br.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR branch_id IN (SELECT b.id FROM branches b WHERE b.brand_id IN (SELECT get_user_brand_ids(auth.uid()))) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
  );

CREATE POLICY "Update vouchers" ON public.vouchers FOR UPDATE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'vouchers.update')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR branch_id IN (SELECT b.id FROM branches b JOIN brands br ON b.brand_id = br.id WHERE br.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR branch_id IN (SELECT b.id FROM branches b WHERE b.brand_id IN (SELECT get_user_brand_ids(auth.uid()))) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
  );

CREATE POLICY "Delete vouchers" ON public.vouchers FOR DELETE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'vouchers.delete')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR branch_id IN (SELECT b.id FROM branches b JOIN brands br ON b.brand_id = br.id WHERE br.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR branch_id IN (SELECT b.id FROM branches b WHERE b.brand_id IN (SELECT get_user_brand_ids(auth.uid()))) OR branch_id IN (SELECT get_user_branch_ids(auth.uid())))
  );

-- ==================== VOUCHER_REDEMPTIONS ====================
DROP POLICY IF EXISTS "Root admins can manage all redemptions" ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Users can view redemptions for accessible vouchers" ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Branch operators can create redemptions" ON public.voucher_redemptions;

CREATE POLICY "Select redemptions" ON public.voucher_redemptions FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'vouchers.read') AND voucher_id IN (SELECT id FROM vouchers));

CREATE POLICY "Insert redemptions" ON public.voucher_redemptions FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'vouchers.redeem') AND voucher_id IN (SELECT id FROM vouchers));

CREATE POLICY "Delete redemptions" ON public.voucher_redemptions FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'vouchers.update'));

-- ==================== BRAND_DOMAINS ====================
DROP POLICY IF EXISTS "Anyone can read brand domains" ON public.brand_domains;
DROP POLICY IF EXISTS "Root admins can manage brand domains" ON public.brand_domains;
DROP POLICY IF EXISTS "Tenant admins can manage brand domains" ON public.brand_domains;
DROP POLICY IF EXISTS "Brand admins can manage own brand domains" ON public.brand_domains;

CREATE POLICY "Select brand domains" ON public.brand_domains FOR SELECT USING (true);

CREATE POLICY "Insert brand domains" ON public.brand_domains FOR INSERT TO authenticated
  WITH CHECK (
    user_has_permission(auth.uid(), 'domains.create')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  );

CREATE POLICY "Update brand domains" ON public.brand_domains FOR UPDATE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'domains.update')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  );

CREATE POLICY "Delete brand domains" ON public.brand_domains FOR DELETE TO authenticated
  USING (
    user_has_permission(auth.uid(), 'domains.delete')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  );

-- ==================== USER_ROLES ====================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Root admins can manage all roles" ON public.user_roles;

CREATE POLICY "Select own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Select all roles (admin)" ON public.user_roles FOR SELECT TO authenticated USING (user_has_permission(auth.uid(), 'roles.read'));
CREATE POLICY "Insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_has_permission(auth.uid(), 'roles.assign'));
CREATE POLICY "Delete roles" ON public.user_roles FOR DELETE TO authenticated USING (user_has_permission(auth.uid(), 'roles.revoke'));
CREATE POLICY "Update roles" ON public.user_roles FOR UPDATE TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'));

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Root admins can view all profiles" ON public.profiles;

CREATE POLICY "Select own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Select all profiles (admin)" ON public.profiles FOR SELECT TO authenticated USING (user_has_permission(auth.uid(), 'users.read'));
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Update any profile (admin)" ON public.profiles FOR UPDATE TO authenticated USING (user_has_permission(auth.uid(), 'users.update'));

-- ==================== SECTION TABLES ====================
DROP POLICY IF EXISTS "Root admins can manage brand sections" ON public.brand_sections;
DROP POLICY IF EXISTS "Tenant admins can manage brand sections" ON public.brand_sections;
DROP POLICY IF EXISTS "Brand admins can manage own brand sections" ON public.brand_sections;

CREATE POLICY "Manage brand sections" ON public.brand_sections FOR ALL TO authenticated
  USING (
    user_has_permission(auth.uid(), 'settings.update')
    AND (has_role(auth.uid(), 'root_admin'::app_role) OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR brand_id IN (SELECT get_user_brand_ids(auth.uid())))
  );

DROP POLICY IF EXISTS "Root admins can manage section sources" ON public.brand_section_sources;
DROP POLICY IF EXISTS "Tenant admins can manage section sources" ON public.brand_section_sources;
DROP POLICY IF EXISTS "Brand admins can manage own section sources" ON public.brand_section_sources;

CREATE POLICY "Manage section sources" ON public.brand_section_sources FOR ALL TO authenticated
  USING (
    user_has_permission(auth.uid(), 'settings.update')
    AND brand_section_id IN (
      SELECT bs.id FROM brand_sections bs WHERE has_role(auth.uid(), 'root_admin'::app_role) OR bs.brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR bs.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Root admins can manage manual items" ON public.brand_section_manual_items;
DROP POLICY IF EXISTS "Tenant admins can manage manual items" ON public.brand_section_manual_items;
DROP POLICY IF EXISTS "Brand admins can manage own manual items" ON public.brand_section_manual_items;

CREATE POLICY "Manage manual items" ON public.brand_section_manual_items FOR ALL TO authenticated
  USING (
    user_has_permission(auth.uid(), 'settings.update')
    AND brand_section_id IN (
      SELECT bs.id FROM brand_sections bs WHERE has_role(auth.uid(), 'root_admin'::app_role) OR bs.brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))) OR bs.brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    )
  );

-- ==================== RBAC META TABLES ====================
DROP POLICY IF EXISTS "Root admins can manage roles" ON public.roles;
CREATE POLICY "Manage roles table" ON public.roles FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'));

DROP POLICY IF EXISTS "Root admins can manage permissions" ON public.permissions;
CREATE POLICY "Manage permissions table" ON public.permissions FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'));

DROP POLICY IF EXISTS "Root admins can manage role_permissions" ON public.role_permissions;
CREATE POLICY "Manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'));

DROP POLICY IF EXISTS "Root admins can manage all overrides" ON public.user_permission_overrides;
CREATE POLICY "Manage overrides" ON public.user_permission_overrides FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'roles.assign'));

-- ==================== SECTION TEMPLATES ====================
DROP POLICY IF EXISTS "Root admins can manage templates" ON public.section_templates;
CREATE POLICY "Manage templates" ON public.section_templates FOR ALL TO authenticated USING (user_has_permission(auth.uid(), 'settings.update'));
