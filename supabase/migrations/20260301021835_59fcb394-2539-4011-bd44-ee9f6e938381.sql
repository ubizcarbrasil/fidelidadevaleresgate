
-- Allow brand/branch admins to read audit logs scoped to their brand/branch
CREATE POLICY "Brand/branch admins read scoped audit logs"
ON public.audit_logs
FOR SELECT
USING (
  (scope_type = 'BRAND' AND scope_id IN (SELECT get_user_brand_ids(auth.uid())))
  OR
  (scope_type = 'BRANCH' AND scope_id IN (SELECT get_user_branch_ids(auth.uid())))
  OR
  (scope_type = 'BRAND' AND scope_id IN (
    SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
  ))
);
