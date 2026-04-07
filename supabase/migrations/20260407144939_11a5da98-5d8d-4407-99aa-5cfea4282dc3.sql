-- Allow authenticated users to insert feed events
CREATE POLICY "Authenticated users can insert feed events"
  ON public.city_feed_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);