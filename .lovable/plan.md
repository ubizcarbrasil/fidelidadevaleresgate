## Diagnóstico

A tela "Foto obrigatória" do Campeonato falha porque o motorista usa **sessão impersonada** (`DriverSessionContext`), ou seja, `auth.uid()` é `null`. As duas operações que o componente `BloqueioInscricaoSemFoto` tenta executar exigem usuário autenticado:

1. **Upload no bucket `avatars`** → políticas `avatars_insert_own` / `avatars_update_own` exigem role `authenticated` + `customers.user_id = auth.uid()`. A sessão anônima do motorista é bloqueada.
2. **`UPDATE customers SET photo_url`** → RLS de `customers` também exige autenticação/admin, então a atualização retorna 0 linhas mesmo se o upload passasse.

Por isso aparece o erro genérico "Não foi possível enviar a foto. Tente novamente.".

## Plano

### 1. Edge Function `driver-upload-photo` (nova)
- Aceita `multipart/form-data` (ou JSON com base64) contendo `driver_id`, `brand_id` e o arquivo da foto.
- Valida que existe um `customers.id = driver_id` cujo `name` contém `[MOTORISTA]` e pertence ao `brand_id` (mesmo padrão das demais RPCs de motorista impersonado).
- Valida MIME (`image/jpeg|png|webp`) e tamanho (≤ 5 MB).
- Faz upload no bucket `avatars` em `motoristas/{customer_id}/{timestamp}.{ext}` usando **service role** (bypass RLS), com `upsert: true`.
- Atualiza `customers.photo_url` com a URL pública.
- Retorna `{ photo_url }` ou erro estruturado (`bucket_missing`, `invalid_file`, `driver_not_found`, `upload_failed`, `update_failed`).
- `verify_jwt = false` em `supabase/config.toml` (sessão de motorista é anônima).

### 2. Frontend — `BloqueioInscricaoSemFoto.tsx`
- Substituir o upload direto via `supabase.storage` + `update` por chamada à Edge Function `driver-upload-photo` via `supabase.functions.invoke`, passando `driver_id` (já recebido por prop) e o arquivo.
- Tratar os códigos de erro da função para mostrar mensagem específica (bucket não configurado, arquivo inválido, etc.) mantendo o fallback genérico atual.
- Após sucesso: `refetchFoto()` (passando callback) e `onFotoCadastrada()`.

### 3. Validação
- Testar no preview com o motorista impersonado do brand "Leme":
  - selecionar foto → confirmar → confirmar que sobe sem erro.
  - recarregar a tela do Campeonato → o bloqueio some e o card de temporada/duelo aparece.
- Confirmar via SQL que `customers.photo_url` foi populado.

## Arquivos afetados
- `supabase/functions/driver-upload-photo/index.ts` (novo)
- `supabase/config.toml` (registrar a function com `verify_jwt = false`)
- `src/features/campeonato_duelo/components/motorista/BloqueioInscricaoSemFoto.tsx`