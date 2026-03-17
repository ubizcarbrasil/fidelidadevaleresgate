
-- RLS policy: brand_admin can manage permission overrides for users within their brand
CREATE POLICY "brand_admin_manage_overrides"
ON public.user_permission_overrides
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles caller
    WHERE caller.user_id = auth.uid()
      AND caller.role = 'brand_admin'
      AND caller.brand_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles target
        WHERE target.user_id = user_permission_overrides.user_id
          AND target.brand_id = caller.brand_id
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles caller
    WHERE caller.user_id = auth.uid()
      AND caller.role = 'brand_admin'
      AND caller.brand_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles target
        WHERE target.user_id = user_permission_overrides.user_id
          AND target.brand_id = caller.brand_id
      )
  )
);
