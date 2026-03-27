
DROP POLICY IF EXISTS "Authenticated users can report offers" ON public.offer_reports;
CREATE POLICY "Anyone can report offers"
  ON public.offer_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
