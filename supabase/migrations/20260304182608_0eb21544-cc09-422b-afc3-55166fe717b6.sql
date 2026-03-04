-- Allow any authenticated user to upload to brand-assets bucket
CREATE POLICY "Authenticated users can upload brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

-- Allow any authenticated user to update brand assets
CREATE POLICY "Authenticated users can update brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-assets');

-- Allow any authenticated user to delete brand assets  
CREATE POLICY "Authenticated users can delete brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets');