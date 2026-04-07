

## Adicionar foto de perfil do motorista

### Contexto
A tela "Meu Perfil de Duelos" já exibe um placeholder com a inicial do nome. A coluna `avatar_url` já existe na tabela `driver_duel_participants`. Falta: bucket de storage, upload da imagem e UI para selecionar/trocar a foto.

### Plano

**1. Migração SQL — Criar bucket de storage `driver-avatars`**
- Bucket público (as fotos são visíveis nos duelos/ranking)
- Política de upload permissiva (o app usa sessão CPF, não Supabase Auth — mesma abordagem do `brand-assets`)
- Política de delete para permitir substituição

**2. Hook `useUpdateAvatar` em `hook_duelos.ts`**
- Recebe um `File`, faz upload para `driver-avatars/{customer_id}.webp` (sobrescreve)
- Gera a URL pública do storage
- Atualiza `avatar_url` na tabela `driver_duel_participants`
- Invalida queries relevantes

**3. Atualizar `PerfilMotoristaSheet.tsx`**
- Tornar o avatar clicável com um ícone de câmera sobreposto
- Input `type="file"` oculto, aceita `image/*`
- Preview local da imagem selecionada antes de salvar
- Ao clicar "Salvar", faz upload da foto (se alterada) + salva apelido
- Loading state durante upload
- Compressão/resize client-side usando Canvas (max 256x256) para manter leve

### Arquivos
- **Nova migração SQL**: bucket `driver-avatars` + políticas de storage
- **Editar**: `src/components/driver/duels/hook_duelos.ts` — novo hook `useUpdateAvatar`
- **Editar**: `src/components/driver/duels/PerfilMotoristaSheet.tsx` — UI de upload com preview

### Resultado
O motorista poderá tirar uma foto ou escolher da galeria, ver o preview no perfil e salvar. A foto aparecerá nos duelos, ranking e em qualquer lugar que use `avatar_url`.

