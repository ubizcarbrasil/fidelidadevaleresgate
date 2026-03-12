-- Allow anonymous uploads to brand-logos folder during trial signup
CREATE POLICY "Anyone can upload brand logos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = 'brand-logos'
);