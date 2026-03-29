

# Tornar "Resgate com Pontos" sempre visível no sidebar

## Alteração

**Arquivo:** `src/components/consoles/BrandSidebar.tsx` (linhas 71-77)

Remover o `moduleKey: "affiliate_deals"` dos três itens do grupo "Resgate com Pontos", fazendo com que não passem pelo filtro `isModuleEnabled` e fiquem sempre visíveis:

```ts
{
  label: "Resgate com Pontos",
  items: [
    { key: "sidebar.produtos_resgate", defaultTitle: "Produtos de Resgate", url: "/produtos-resgate", icon: ShoppingBag },
    { key: "sidebar.regras_resgate", defaultTitle: "Regras de Resgate", url: "/regras-resgate", icon: Settings2 },
    { key: "sidebar.pedidos_resgate", defaultTitle: "Pedidos de Resgate", url: "/product-redemption-orders", icon: Package },
  ],
},
```

Nenhum outro arquivo é alterado.

