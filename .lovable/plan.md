

## Plano: Corrigir input da página Regras de Resgate

### Problema
Mesmo bug da página anterior: a função `updateField` em `RegrasResgatePage.tsx` (linha 131-136) rejeita strings vazias porque `parseFloat("")` retorna `NaN`. Além disso, o `value` do Input (linha 240) não mostra vazio quando o valor é `0`.

### Mudanças em `src/pages/RegrasResgatePage.tsx`

**1. Atualizar `updateField` (linhas 131-136)** para aceitar string vazia:
```typescript
const updateField = (key: keyof RedemptionRules, value: string) => {
  if (value === "" || value === ".") {
    setForm((prev) => ({ ...prev, [key]: 0 }));
    setDirty(true);
    return;
  }
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return;
  setForm((prev) => ({ ...prev, [key]: num }));
  setDirty(true);
};
```

**2. Atualizar o `value` do Input (linha 240)** para mostrar campo vazio quando valor é `0`:
```typescript
value={form[card.field] === 0 ? "" : form[card.field]}
```

### Resultado
O usuário consegue apagar o valor e digitar um novo número normalmente, igual ao fix já aplicado na página "Conversão por Público". Um arquivo alterado.

