

## Plano: Corrigir erro "null is not an object (evaluating 'brand.id')" no toggle de espelhamento

### Problema
Na página de Produtos de Resgate, o toggle "Espelhar produtos do motorista para cliente" tenta acessar `brand!.id` (linha 226), mas `brand` é `null` no contexto admin quando a marca não é resolvida via domínio. Isso causa o crash.

### Solução
Na mutation `toggleMirrorMutation`, usar `currentBrandId` (que vem do `useBrandGuard()` e está sempre disponível no contexto admin) em vez de `brand!.id`.

### Mudança

**Arquivo**: `src/pages/ProdutosResgatePage.tsx`

1. Na `toggleMirrorMutation` (linha ~220-234):
   - Trocar `brand!.id` por `currentBrandId`
   - Adicionar guard no início: se `!currentBrandId`, lançar erro
   - Para ler `brand_settings_json` atual quando `brand` é null, buscar direto do banco com `currentBrandId`

```typescript
const toggleMirrorMutation = useMutation({
  mutationFn: async (enabled: boolean) => {
    if (!currentBrandId) throw new Error("Marca não identificada");
    // Buscar settings atuais direto do banco (brand pode ser null no admin)
    const { data: brandData } = await supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", currentBrandId)
      .single();
    const current = (brandData?.brand_settings_json as Record<string, any>) ?? {};
    const { error } = await supabase
      .from("brands")
      .update({ brand_settings_json: { ...current, customer_redeem_mirror_driver: enabled } } as any)
      .eq("id", currentBrandId);
    if (error) throw error;
  },
  // ... callbacks mantidos
});
```

2. Na leitura de `mirrorDriver` (linha 44): também usar fallback quando `brand` é null — buscar via query existente ou aceitar false como default (já é o comportamento atual com `brand?.`).

### Resultado
O toggle de espelhamento funcionará corretamente no painel admin, independentemente de `brand` estar carregado ou não no contexto.

