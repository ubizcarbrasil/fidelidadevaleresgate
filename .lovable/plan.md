

## Correção: Botão "Resgate na Cidade" deve abrir lista de parceiros

### Problema
O botão "Resgate na Cidade" na Home do motorista executa `setShowHub(false)`, que apenas troca para a view do Marketplace. Não abre a lista de parceiros.

### Solução
Alterar `DriverPanelPage.tsx` para que `onOpenCityRedeem` abra o `DriverCityPartnersPage` como um hub overlay, igual aos outros overlays (profile, ledger, etc.).

### Alterações

**`src/pages/DriverPanelPage.tsx`**
1. Importar `DriverCityPartnersPage`
2. Mudar `onOpenCityRedeem` de `() => setShowHub(false)` para `() => setHubOverlay({ type: "cityPartners" })`
3. Adicionar renderização condicional do overlay:
```tsx
{hubOverlay?.type === "cityPartners" && effectiveBranch && (
  <DriverCityPartnersPage
    brandId={brand.id}
    branchId={effectiveBranch.id}
    fontHeading={fontHeading}
    onBack={() => setHubOverlay(null)}
  />
)}
```

Nenhuma outra alteração necessária. O componente `DriverCityPartnersPage` já existe e funciona.

