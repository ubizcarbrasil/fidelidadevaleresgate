-- Allow brand members to update machine_ride_notifications (for identify feature)
CREATE POLICY "Brand members can update notifications"
ON public.machine_ride_notifications
FOR UPDATE
TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())))
WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())));

-- Allow brand members to update machine_rides (for identify feature)
CREATE POLICY "Brand members can update rides"
ON public.machine_rides
FOR UPDATE
TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())))
WITH CHECK (brand_id IN (SELECT get_user_brand_ids(auth.uid())));