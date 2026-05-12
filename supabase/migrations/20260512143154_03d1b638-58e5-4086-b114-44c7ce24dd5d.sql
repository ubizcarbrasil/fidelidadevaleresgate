-- Criar bucket avatars (público para leitura, upload restrito)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE 'motoristas/' || (
      SELECT id::text FROM public.customers
       WHERE user_id = auth.uid()
       LIMIT 1
    ) || '/%'
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'motoristas/' || (
      SELECT id::text FROM public.customers
       WHERE user_id = auth.uid()
       LIMIT 1
    ) || '/%'
  );

DROP POLICY IF EXISTS avatars_select_public ON storage.objects;
CREATE POLICY avatars_select_public ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');