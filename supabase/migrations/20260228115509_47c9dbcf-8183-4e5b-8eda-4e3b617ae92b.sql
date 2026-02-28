-- Create public bucket for brand assets (logos, favicons, backgrounds)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true);

-- Anyone can view brand assets (public bucket)
CREATE POLICY "Brand assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Root admins can upload brand assets
CREATE POLICY "Root admins can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'root_admin'::public.app_role)
);

-- Root admins can update brand assets
CREATE POLICY "Root admins can update brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'root_admin'::public.app_role)
);

-- Root admins can delete brand assets
CREATE POLICY "Root admins can delete brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'root_admin'::public.app_role)
);

-- Tenant admins can manage assets in their tenant folder
CREATE POLICY "Tenant admins can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'tenant_admin'::public.app_role)
);

CREATE POLICY "Tenant admins can update brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'tenant_admin'::public.app_role)
);

CREATE POLICY "Tenant admins can delete brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'tenant_admin'::public.app_role)
);

-- Brand admins can manage assets in their brand folder
CREATE POLICY "Brand admins can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'brand_admin'::public.app_role)
);

CREATE POLICY "Brand admins can update brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'brand_admin'::public.app_role)
);

CREATE POLICY "Brand admins can delete brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND public.has_role(auth.uid(), 'brand_admin'::public.app_role)
);