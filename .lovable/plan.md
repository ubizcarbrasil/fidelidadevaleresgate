

## Plano: Adicionar botão "Meus Resgates" no app do motorista

### Problema
O componente `DriverCityRedemptionHistory` existe mas não é mais acessível — foi desconectado quando o botão "Meus Resgates" virou "Ver Parceiros".

### Solução
Adicionar um novo botão "Meus Resgates" na Home do motorista (dentro do `QuickActionCards`) e conectá-lo ao overlay `DriverCityRedemptionHistory`.

### Alterações

**1. `src/pages/DriverPanelPage.tsx`**
- Adicionar `"cityRedemptions"` ao tipo do `hubOverlay`
- Importar `DriverCityRedemptionHistory`
- Passar novo callback `onOpenCityRedemptions` para `DriverHomePage`
- Renderizar overlay:
```tsx
{hubOverlay?.type === "cityRedemptions" && (
  <DriverCityRedemptionHistory fontHeading={fontHeading} onBack={() => setHubOverlay(null)} />
)}
```

**2. `src/components/driver/home/DriverHomePage.tsx`**
- Adicionar prop `onOpenCityRedemptions`
- Passar para `QuickActionCards`

**3. `src/components/driver/home/QuickActionCards.tsx`**
- Adicionar prop `onCityRedemptions` e `showCityRedemptions`
- Renderizar novo botão com ícone `Ticket` e texto "Meus Resgates" / "Acompanhe seus resgates na cidade"
- Exibir quando `showCityRedemptions` for `true` (mesma condição do botão Resgate na Cidade)

### Resultado
O motorista terá dois botões na Home:
- **Resgate na Cidade** → abre lista de parceiros
- **Meus Resgates** → abre histórico de resgates (PINs ativos, usados, expirados)

