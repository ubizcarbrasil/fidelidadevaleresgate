

# Fix: Remover zeros à esquerda nos inputs numéricos

## Problema
Nos inputs `type="number"` em mobile, o navegador mantém zeros à esquerda (ex: "045" em vez de "45", "030" em vez de "30"). Isso acontece porque o input numérico do mobile preserva o texto digitado internamente, mesmo com `value` controlado pelo React.

## Solução
Adicionar handler `onBlur` em todos os inputs numéricos dos wizards para normalizar o valor (remover leading zeros) quando o usuário sai do campo. Isso é seguro, sem impacto visual e resolve o problema em mobile.

## Arquivos afetados

### 1. `src/components/store-voucher-wizard/steps/StepValueConfig.tsx`
- Adicionar `onBlur` em todos os `<Input type="number">` (~8 ocorrências)
- No `onBlur`, re-setar o valor com `Number(e.target.value)` para forçar o React a re-renderizar sem zeros

### 2. `src/components/voucher-wizard/steps/StepDiscountValue.tsx`
- Mesmo tratamento nos 4 inputs numéricos (discount_percent, discount_fixed_value, min_purchase)

### Lógica do fix
```tsx
// Antes (só onChange):
<Input type="number" value={data.product_price}
  onChange={(e) => update({ product_price: Number(e.target.value) })} />

// Depois (onChange + onBlur para normalizar):
<Input type="number" value={data.product_price}
  onChange={(e) => update({ product_price: Number(e.target.value) })}
  onBlur={(e) => { e.target.value = String(Number(e.target.value)); }} />
```

O `onBlur` força o input nativo a atualizar seu valor interno, removendo zeros à esquerda quando o usuário sai do campo.

## Impacto
- Zero risco funcional — apenas normalização visual
- Não altera estilos, layout ou lógica de dados
- Resolve o problema em iOS e Android

