

## Adicionar botão "Criar Banner" na página de Espelhamento

### O que será feito

Adicionar um botão "Criar Banner" nas ações de cada deal (tanto mobile quanto desktop) que redireciona o usuário para a Central de Banners com os dados da oferta pré-preenchidos (imagem e link da oferta).

### Alteração

**Arquivo**: `src/components/mirror-sync/MirrorSyncDealsTable.tsx`

1. Importar `Image` (ícone lucide) e `useNavigate` do react-router-dom
2. Adicionar botão com ícone `Image` na linha de ações do deal (desktop e mobile)
3. Ao clicar, navegar para `/banner-manager?prefill_image={deal.image_url}&prefill_link={deal.origin_url}&prefill_title={deal.title}`

**Arquivo**: `src/pages/BannerManagerPage.tsx`

1. Ler query params (`prefill_image`, `prefill_link`, `prefill_title`) via `useSearchParams`
2. No `useEffect`, se existirem params de prefill, abrir o dialog automaticamente com o form pré-preenchido (imagem, link_url como tipo "external", título)
3. Limpar os search params após preencher

**2 arquivos alterados.**

