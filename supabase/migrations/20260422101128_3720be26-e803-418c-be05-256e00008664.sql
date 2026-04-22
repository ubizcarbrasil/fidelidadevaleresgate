-- Bucket privado para upload de planilhas de importação de motoristas
INSERT INTO storage.buckets (id, name, public)
VALUES ('importacoes-motoristas', 'importacoes-motoristas', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: cada usuário só acessa seus próprios arquivos (pasta = auth.uid())
CREATE POLICY "Usuarios podem inserir suas planilhas de importacao"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'importacoes-motoristas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuarios podem ler suas planilhas de importacao"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'importacoes-motoristas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuarios podem deletar suas planilhas de importacao"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'importacoes-motoristas'
  AND auth.uid()::text = (storage.foldername(name))[1]
);