
-- Fix: require authentication for inserting affiliate clicks
DROP POLICY "Insert affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Authenticated insert affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
