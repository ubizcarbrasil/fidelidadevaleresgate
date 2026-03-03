
-- Drop the restrictive ALL policy and recreate as PERMISSIVE
DROP POLICY "Root manages home templates" ON public.home_template_library;
CREATE POLICY "Root manages home templates"
ON public.home_template_library
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'root_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'root_admin'::app_role));

-- Also fix the SELECT policy to be permissive
DROP POLICY "Anyone authenticated can read templates" ON public.home_template_library;
CREATE POLICY "Anyone authenticated can read templates"
ON public.home_template_library
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
