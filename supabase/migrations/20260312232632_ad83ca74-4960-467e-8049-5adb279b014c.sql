CREATE POLICY "Authenticated users can read brand_modules"
ON public.brand_modules
FOR SELECT
TO authenticated
USING (true);