

## Plano: Corrigir o toggle de espelhamento que não reflete o estado visualmente

### Problema
O estado visual do switch (`mirrorDriver`, linha 44) lê de `brand?.brand_settings_json`, mas no contexto admin `brand` é `null`, então o switch sempre mostra "desligado" — mesmo após salvar com sucesso. A invalidação de `["brand"]` não resolve porque `brand` vem do `BrandContext` (resolução por domínio), que permanece `null`.

### Solução
Usar estado local + query direta ao banco para determinar o valor do mirror, em vez de depender do `brand` do contexto.

### Mudanças

**Arquivo**: `src/pages/ProdutosResgatePage.tsx`

1. Adicionar uma query dedicada para buscar o `brand_settings_json` usando `currentBrandId`:

```typescript
const { data: brandSettings } = useQuery({
  queryKey: ["brand-settings", currentBrandId],
  queryFn: async () => {
    const { data } = await supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", currentBrandId!)
      .single();
    return (data?.brand_settings_json as Record<string, any>) ?? {};
  },
  enabled: !!currentBrandId,
});

const mirrorDriver = brandSettings?.customer_redeem_mirror_driver === true;
```

2. Na `toggleMirrorMutation.onSuccess`, invalidar `["brand-settings"]` em vez de (ou além de) `["brand"]`:

```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["brand-settings"] });
  toast.success("Configuração de espelhamento atualizada");
},
```

3. Remover a linha 44 antiga que dependia de `brand?.brand_settings_json`.

### Resultado
O toggle refletirá corretamente o estado salvo no banco, atualizando visualmente após cada mudança.

