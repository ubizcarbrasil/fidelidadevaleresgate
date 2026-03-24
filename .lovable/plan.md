

## Criar Banner por IA direto da página de Espelhamento

Em vez de redirecionar para a Central de Banners, o botão "Criar Banner" vai gerar um banner promocional usando IA (via edge function `enhance-image` ou nova edge function dedicada) a partir da imagem e dados do deal, e então salvar diretamente na tabela `banners`.

### Fluxo

1. Usuário clica no botão "Criar Banner" em um deal
2. Abre um Dialog inline com preview da imagem original e opção de gerar
3. Chama a edge function com um prompt específico para criar banner promocional (1200x514) usando a imagem do produto como referência, incluindo título e preço
4. Mostra preview do resultado gerado
5. Usuário aceita → banner é salvo automaticamente na tabela `banners` (ativo, link externo para a oferta)

### Alterações

**Arquivo 1**: `src/components/mirror-sync/AiBannerDialog.tsx` (NOVO)

Componente Dialog dedicado que:
- Recebe `deal` (image_url, title, price, origin_url) e `brandId`
- Chama `supabase.functions.invoke("enhance-image", { body: { image_url, mode: "redesign", context: "banner" } })` — reutiliza a edge function existente com prompt que já gera imagens no formato banner (1200x514)
- Mostra loading → preview lado a lado (original vs gerado)
- Botão "Salvar como Banner" → insere na tabela `banners` com `brand_id`, `image_url` (gerada), `link_url` (origin_url), `link_type: "external"`, `title`, `is_active: true`, `start_at: now()`
- Botão "Gerar novamente" para tentar outra versão
- Toast de sucesso ao salvar

**Arquivo 2**: `src/components/mirror-sync/MirrorSyncDealsTable.tsx`

- Substituir `handleCreateBanner` (que fazia navigate) por abrir o `AiBannerDialog`
- Adicionar state `bannerDeal` para controlar qual deal está gerando banner
- Importar e renderizar `<AiBannerDialog>`
- Remover import de `useNavigate` se não for mais usado

**2 arquivos alterados** (1 novo + 1 editado).

