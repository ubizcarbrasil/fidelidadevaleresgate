

## Plano: Página de Categoria para Achadinhos (Cliente + Motorista)

### O que será criado

Uma nova página dedicada para cada categoria de Achadinhos, acessada ao clicar "Ver todos". Layout inspirado no print de referência: header com nome da categoria, carrossel de banners, barra de busca, e listagem horizontal de produtos (imagem, título, descrição, preço, marketplace). Sem curtidas, sem cashback. Clique leva direto ao link do marketplace.

Cada categoria poderá ter banners próprios configuráveis com as 3 opções de IA (redesenhar, ajustar tamanho, melhorar qualidade) via o componente `ImageAiActions` já existente.

### Migração de banco

Adicionar tabela `affiliate_category_banners`:
- `id`, `brand_id`, `category_id` (FK → affiliate_deal_categories), `image_url`, `title`, `link_url`, `order_index`, `is_active`, `created_at`

RLS: acesso por brand_id do usuário autenticado.

### Novos componentes

**1. `src/components/customer/AchadinhoCategoryPage.tsx`**
- Substituirá o overlay grid atual (`AchadinhoDealsOverlay`)
- Layout:
  - Header: seta voltar + ícone/nome da categoria + subtítulo com contagem
  - Carrossel de banners (da tabela `affiliate_category_banners`)
  - Barra de busca (filtra título/descrição/store_name)
  - Lista de produtos em formato **horizontal** (como no print):
    - Imagem quadrada à esquerda (~100px)
    - Ao lado: nome do marketplace (pequeno, muted), título (2 linhas), preço em negrito, preço original riscado
    - Sem curtidas, sem cashback
    - Clique abre `affiliate_url`

**2. `src/components/driver/DriverCategoryPage.tsx`**
- Mesmo layout que o do cliente, mas usa o tema/estilo do DriverMarketplace
- Substituirá o overlay inline atual (linhas 410-448 do DriverMarketplace)

### Alterações em arquivos existentes

**`src/components/customer/AchadinhoSection.tsx`**
- "Ver todos" de cada categoria abre o novo `AchadinhoCategoryPage` (overlay full-screen) em vez do `AchadinhoDealsOverlay`

**`src/components/customer/AchadinhoDealsOverlay.tsx`**
- Refatorar para usar o novo layout de lista horizontal + banners + busca

**`src/components/driver/DriverMarketplace.tsx`**
- `setOpenCategory(cat)` abre o novo `DriverCategoryPage` em vez do overlay inline atual

### Página de admin para banners de categoria

**`src/pages/AffiliateCategoriesPage.tsx`**
- Adicionar seção de banners dentro da edição de cada categoria
- Upload de imagem com `StorageImageUpload` + `ImageAiActions` (3 opções de IA: redesenhar, ajustar, melhorar)
- CRUD de banners por categoria

### Visual do card de produto (lista horizontal)

```text
┌──────────────────────────────────┐
│ ┌────────┐  Marketplace Name     │
│ │        │  Título do produto... │
│ │  IMG   │  R$ 7.037,23          │
│ │        │  R$ 9.000,00 (riscado)│
│ └────────┘                       │
├──────────────────────────────────┤
│ ┌────────┐  ...                  │
```

### Arquivos envolvidos
- Nova migração SQL (tabela `affiliate_category_banners`)
- `src/components/customer/AchadinhoCategoryPage.tsx` — novo
- `src/components/driver/DriverCategoryPage.tsx` — novo
- `src/components/customer/AchadinhoDealsOverlay.tsx` — refatorar
- `src/components/customer/AchadinhoSection.tsx` — apontar para nova página
- `src/components/driver/DriverMarketplace.tsx` — apontar para nova página
- `src/pages/AffiliateCategoriesPage.tsx` — admin de banners por categoria

