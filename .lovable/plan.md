

## Correção: Links Úteis mostrando "Sem domínio" para Ubiz Resgata

### Causa

No `DashboardQuickLinks.tsx` (linha 44), a query busca domínios da brand excluindo `app.valeresgate.com.br`. Para a Ubiz Resgata, esse é o **único** domínio — então a query retorna `null` e aparece "Sem domínio" + "Configure um domínio".

### Correção

**Arquivo:** `src/components/dashboard/DashboardQuickLinks.tsx` (linhas 35-51)

Buscar **todos** os domínios ativos da brand (sem excluir nenhum), mas priorizar domínios que NÃO sejam o portal. Se o único disponível for `app.valeresgate.com.br`, usar esse mesmo.

```typescript
// Buscar todos os domínios ativos, ordenados: não-portal primeiro
const { data: brandDomains } = useQuery({
  queryKey: ["brand-domain-links", currentBrandId],
  queryFn: async () => {
    if (!currentBrandId) return [];
    const { data } = await supabase
      .from("brand_domains")
      .select("domain")
      .eq("brand_id", currentBrandId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false });
    return data || [];
  },
  enabled: !!currentBrandId,
});

// Priorizar domínio não-portal; fallback para portal
const PORTAL = "app.valeresgate.com.br";
const nonPortal = brandDomains?.find(d => d.domain !== PORTAL);
const brandDomain = nonPortal?.domain ?? brandDomains?.[0]?.domain ?? null;
```

### Resultado

| Brand | Antes | Depois |
|-------|-------|--------|
| Ubiz Resgata | "Sem domínio" | `app.valeresgate.com.br` (links funcionais) |
| Meu Mototáxi | `meu-mototaxi.valeresgate.com.br` | Sem mudança |
| Ubiz Car | Domínio próprio | Sem mudança |

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/dashboard/DashboardQuickLinks.tsx` | Remover `.neq()`, buscar todos domínios e priorizar não-portal |

