
-- Fix overly permissive INSERT policy - only service role (which bypasses RLS) should insert
DROP POLICY "Service role inserts notifications" ON public.customer_notifications;

-- Edge function uses service_role key which bypasses RLS, so no INSERT policy needed for regular users
-- If needed in the future, a specific policy can be added
