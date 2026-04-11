

## Plano: Corrigir input que não permite apagar valores

### Problema
A função `updateField` rejeita valores vazios porque `parseFloat("")` retorna `NaN`, impedindo o usuário de limpar o campo antes de digitar um novo número.

### Solução
Permitir que o campo fique vazio temporariamente (string vazia), e só converter para número quando houver valor válido. Usar o valor do input como string controlada ou permitir `0`/vazio no estado.

### Mudança em `src/pages/conversao_resgate/pagina_conversao_resgate.tsx`

**Linha 85-90** — Alterar `updateField` para aceitar string vazia:
```typescript
const updateField = (key: keyof TaxasConversao, value: string) => {
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

Também ajustar o `value` do Input para mostrar string vazia quando o valor é `0`, permitindo que o campo fique visualmente limpo:
```typescript
value={form[card.field] === 0 ? "" : form[card.field]}
```

### Resultado
O usuário consegue apagar o valor, digitar um novo número, e o campo se comporta naturalmente. Um arquivo alterado.

