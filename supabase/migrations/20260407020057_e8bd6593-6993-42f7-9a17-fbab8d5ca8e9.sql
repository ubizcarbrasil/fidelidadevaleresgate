
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-avatars', 'driver-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Driver avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-avatars');

CREATE POLICY "Anyone can upload driver avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'driver-avatars');

CREATE POLICY "Anyone can update driver avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'driver-avatars');

CREATE POLICY "Anyone can delete driver avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'driver-avatars');
