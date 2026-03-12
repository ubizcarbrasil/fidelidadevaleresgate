

## Plano: Remover "Regra de Pontos do Parceiro" dos sidebars administrativos

Remover o item de menu `/store-points-rule` de três arquivos, mantendo a página acessível apenas pelo painel do lojista (StoreOwnerPanel).

### Alterações

1. **`src/components/consoles/RootSidebar.tsx`** (linha 74): Remover `{ title: "Regra de Pontos do Parceiro", url: "/store-points-rule", ... }`

2. **`src/components/consoles/BrandSidebar.tsx`** (linha 87): Remover `{ key: "sidebar.regra_parceiro", defaultTitle: "Regra de Pontos do Parceiro", url: "/store-points-rule", ... }`

3. **`src/components/consoles/BranchSidebar.tsx`** (linha 54): Remover `{ title: "Minha Regra de Pontos", url: "/store-points-rule", ... }`

A rota e a página continuam existindo para acesso pelo StoreOwnerPanel.

