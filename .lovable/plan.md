
## Plano: Mostrar produtos resgatáveis com pontos para o passageiro

### Diagnóstico

Dois problemas identificados:

1. **Página Início (Home)**: A seção "Resgatar com Pontos" no carrossel de Achadinhos está restrita apenas a motoristas (`isDriver &&` na linha 234 de `AchadinhoSection.tsx`). Passageiros nunca veem essa seção, mesmo com 51 produtos `redeemable_by = 'both'` disponíveis.

2. **Aba "Loja"**: O `CustomerRedeemStorePage` lê `mirrorDriver` de `brand?.brand_settings_json` (linha 55). Se `mirrorDriver = false`, filtra por `redeemable_by IN ('customer', 'both')` — isso deveria funcionar com os 51 produtos `both`. Mas o cálculo de `redeem_points_cost` já está correto no banco (ex: produto de R$1.128 = 56.400 pts).

### Solução

**Arquivo 1**: `src/components/customer/AchadinhoSection.tsx`

- Remover a restrição `isDriver &&` da seção "Resgatar com Pontos"
- Filtrar os deals resgatáveis para o público correto:
  - Se `isDriver`: mostrar todos os resgatáveis
  - Se passageiro: mostrar apenas `redeemable_by = 'both'` ou `'customer'`
- Manter a seção visível para passageiros quando existem produtos resgatáveis para eles

**Arquivo 2**: `src/components/customer/CustomerRedeemStorePage.tsx`

- Verificar que a query na aba "Loja" funciona corretamente para passageiros (sem `mirrorDriver`)
- O filtro atual `in("redeemable_by", ["customer", "both"])` está correto, mas preciso confirmar que a query executa sem erro

### Mudança principal

```typescript
// ANTES (linha 232-242 de AchadinhoSection.tsx):
// Virtual "Resgatar com Pontos" category — redeemable deals (only for drivers)
const redeemableCount = deals.filter(d => d.is_redeemable).length;
if (isDriver && redeemableCount >= MIN_DEALS) { ... }

// DEPOIS:
// Virtual "Resgatar com Pontos" category — for drivers and passengers
const redeemableDeals = deals.filter(d => {
  if (!d.is_redeemable) return false;
  // Filtrar por público quando não é motorista
  if (!isDriver) {
    const rb = (d as any).redeemable_by;
    return rb === 'both' || rb === 'customer';
  }
  return true;
});
if (redeemableDeals.length >= MIN_DEALS) { ... }
```

Também será necessário garantir que o campo `redeemable_by` está sendo buscado na query de deals do Achadinhos.

### Resultado

- Passageiros verão a seção "Resgatar com Pontos" na home com os produtos disponíveis e custo em pontos
- A aba "Loja" continuará funcionando normalmente
- A separação driver/customer permanece respeitada nos filtros
