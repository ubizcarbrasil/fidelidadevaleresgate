

## Plano: "Ver todos" no Achadinhos abrindo grid de categorias

### Problema
A seção Achadinhos não tem o botão "Ver todos". O usuário quer que, ao clicar, abra um overlay no mesmo formato do grid de categorias (cards quadrados 2 colunas), mas mostrando as categorias de achadinhos (`affiliate_deal_categories`).

### Alterações

**1. `src/components/customer/AchadinhoSection.tsx`**
- Aceitar nova prop `onOpenAllCategories?: () => void`
- Adicionar botão "Ver todos >" ao lado do título (mesmo padrão do ForYouSection/EmissorasSection)

**2. Criar `src/components/customer/AchadinhoCategoryGridOverlay.tsx`**
- Overlay fullscreen (mesmo layout do `CategoryGridOverlay` existente)
- Busca categorias da tabela `affiliate_deal_categories` (com contagem de deals ativos)
- Grid 2 colunas com cards quadrados, ícone Lucide + nome
- Ao clicar em uma categoria, filtra os deals daquela categoria (abre um segundo overlay ou volta à home com filtro)

**3. `src/pages/customer/CustomerHomePage.tsx`**
- Receber e repassar nova prop `onOpenAchadinhoCategoryGrid` para `AchadinhoSection`

**4. `src/components/customer/CustomerLayout.tsx`**
- Adicionar estado `achadinhoCatGridOpen`
- Renderizar `AchadinhoCategoryGridOverlay` dentro do `AnimatePresence`
- Ao clicar em uma categoria no grid, abrir deals filtrados (pode reusar o SectionDetailOverlay ou um overlay dedicado com cards de deals)
- Passar `onOpenAchadinhoCategoryGrid` para `CustomerHomePage`

### Fluxo
```text
Home → "Ver todos" → AchadinhoCategoryGridOverlay (grid 2col)
  → clica categoria → AchadinhoCategoryDealsOverlay (lista de deals filtrados)
```

