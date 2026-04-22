
-- Bucket privado para exportações temporárias de motoristas (CSV)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exportacoes-motoristas', 'exportacoes-motoristas', false)
ON CONFLICT (id) DO NOTHING;

-- Política: usuários autenticados podem ler seus próprios exports
-- (path obrigatório: {auth.uid()}/...)
CREATE POLICY "Usuarios autenticados leem seus proprios exports motoristas"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exportacoes-motoristas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuários autenticados podem inserir nas próprias pastas
CREATE POLICY "Usuarios autenticados gravam seus proprios exports motoristas"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exportacoes-motoristas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuários autenticados podem sobrescrever (update) seus arquivos
CREATE POLICY "Usuarios autenticados atualizam seus proprios exports motoristas"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exportacoes-motoristas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuários autenticados podem deletar seus próprios exports
CREATE POLICY "Usuarios autenticados deletam seus proprios exports motoristas"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exportacoes-motoristas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
