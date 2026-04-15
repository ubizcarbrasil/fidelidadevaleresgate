CREATE POLICY "Anon can read brand_modules"
  ON public.brand_modules FOR SELECT TO anon USING (true);