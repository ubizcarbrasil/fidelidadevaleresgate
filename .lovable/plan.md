

## Plano: Corrigir dados do painel — filtrar métricas por brand_id

### Problema

O hook `useMetric` (linha 32-43 do `Dashboard.tsx`) faz `SELECT count(*)` nas tabelas **sem filtrar por `brand_id`**. Resultado: um admin de marca vê totais globais da plataforma inteira (183 parceiros, 229 ofertas, etc.) em vez dos dados apenas da sua marca.

### Solução

Refatorar o `useMetric` para aceitar `brandId` e aplicá-lo automaticamente. Todas as chamadas de métricas que operam em tabelas com coluna `brand_id` precisam receber o filtro.

### Tabelas afetadas e filtros necessários

| Tabela | Tem `brand_id` | Filtrar? |
|--------|---------------|----------|
| `tenants` | Não | Não (só ROOT vê) |
| `brands` | Não (é a própria) | Não (só ROOT/TENANT) |
| `branches` | Sim | Sim |
| `stores` | Sim | Sim |
| `offers` | Sim | Sim |
| `customers` | Sim | Sim |
| `redemptions` | Sim | Sim |
| `vouchers` | Sim | Sim |
| `earning_events` | Sim | Sim |
| `store_points_rules` | Sim (via store → brand) | Sim, via join ou subquery |
| `profiles` | Não diretamente | Manter sem filtro (RLS cuida) |

### Alterações no código

**Arquivo**: `src/pages/Dashboard.tsx`

1. Modificar `useMetric` para aceitar um parâmetro `brandId` opcional e aplicar `.eq("brand_id", brandId)` quando fornecido.

2. Atualizar todas as chamadas (linhas 506-528) para passar `currentBrandId` quando o usuário não for ROOT:

```typescript
function useMetric(table: string, enabled = true, filter?: (q: any) => any, filterKey?: string, brandId?: string) {
  return useQuery({
    queryKey: [`${table}-count`, filterKey ?? "all", brandId ?? "global"],
    queryFn: async () => {
      let q = (supabase.from as any)(table).select("*", { count: "exact", head: true });
      if (brandId) q = q.eq("brand_id", brandId);
      if (filter) q = filter(q);
      const { count } = await q;
      return count || 0;
    },
    enabled,
  });
}
```

3. Aplicar `brandId` nas chamadas:
```typescript
const brandFilter = isRoot ? undefined : currentBrandId;

const { data: branches } = useMetric("branches", true, undefined, undefined, brandFilter);
const { data: storesTotal } = useMetric("stores", true, undefined, undefined, brandFilter);
const { data: storesActive } = useMetric("stores", true, (q) => q.eq("is_active", true), "active", brandFilter);
// ... mesmo padrão para offers, customers, redemptions, vouchers, earning_events
```

4. Para `store_points_rules` (não tem `brand_id` diretamente), filtrar via subquery nos `store_id` da marca, ou deixar como está se RLS já cuida.

5. Aplicar o mesmo filtro nos gráficos `fetchChartData` (linhas 533-549) — adicionar `.eq("brand_id", brandId)` quando não for ROOT.

6. Incluir `brandFilter` na `queryKey` dos gráficos para evitar cache cruzado entre marcas.

### Impacto
- Corrige os números para refletir apenas os dados da marca do usuário logado
- ROOT continua vendo dados globais
- Sem impacto em performance (apenas adiciona um filtro WHERE já indexado)

