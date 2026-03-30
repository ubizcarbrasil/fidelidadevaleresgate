

# Formatar pontos com separador de milhar (ex: 720 → 720, 6.800 → 6.800)

## Problema
Valores de pontos são exibidos sem separador de milhar — ex: `6800 pts` em vez de `6.800 pts`.

## Solução
Criar uma função utilitária `formatPoints` e aplicar em todos os locais que exibem pontos.

### 1. Criar `src/lib/formatPoints.ts`
```ts
export function formatPoints(value: number | null | undefined): string {
  if (value == null) return "0";
  return Number(value).toLocaleString("pt-BR");
}
```

### 2. Aplicar em todos os arquivos que exibem pontos

| Arquivo | Locais |
|---|---|
| `src/components/driver/DriverRedeemStorePage.tsx` | saldo (`{pointsBalance} pts`), custo do card (`{pointsCost} pts`) |
| `src/components/driver/DriverRedeemCheckout.tsx` | custo (`{deal.redeem_points_cost} pts`), saldo, botão confirmar |
| `src/components/driver/DriverRedeemOrderHistory.tsx` | `{order.points_spent} pts` |
| `src/components/driver/DriverMarketplace.tsx` | `{pointsCost} pts` nos cards de resgate |
| `src/components/driver-management/tabs/AbaPontuacaoMotorista.tsx` | `{driver.points_balance} pts`, `+{driver.total_ride_points} pts` |
| `src/components/driver-management/DriverLedgerSection.tsx` | `{e.points_amount}` no badge |
| `src/pages/DriverManagementPage.tsx` | `{driver.points_balance} pts` na lista |
| `src/pages/ProdutosResgatePage.tsx` | `costDisplay` na tabela |
| `src/pages/AffiliateDealsPage.tsx` | `{d.redeem_points_cost} pts` |
| `src/pages/PointsLedgerPage.tsx` | `{e.points_amount}` |
| `src/pages/CrmParetoPage.tsx` | `{c.points_balance}` |
| `src/pages/customer/CustomerWalletPage.tsx` | `{entry.points_amount} pts` |
| `src/pages/customer/CustomerRedemptionsPage.tsx` | saldo de pontos |
| `src/pages/customer/CustomerProfilePage.tsx` | `{offer.value_rescue} pts` |
| `src/components/dashboard/DashboardKpiSection.tsx` | pontos motoristas/clientes (já usa `toLocaleString` — ok) |

### Padrão de mudança
```tsx
// Antes
{pointsCost} pts

// Depois
{formatPoints(pointsCost)} pts
```

~15 arquivos editados, todos com a mesma mudança simples: importar `formatPoints` e envolver o valor numérico.

