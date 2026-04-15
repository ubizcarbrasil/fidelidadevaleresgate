

## Otimização de carregamento do Dashboard

### Problema
O Dashboard (`/`) dispara mais de 20 queries simultâneas ao Supabase no momento do carregamento:
- 12+ chamadas `useMetric` (cada uma faz um `SELECT count(*)`)
- 2 queries de gráficos com paginação (redemptions + machine_rides)
- 1 RPC `get_points_summary`
- 1 query de `affiliate_deals` para contar lojas únicas
- Queries adicionais de componentes lazy (TasksSection, ActivityFeed, PointsFeed, AchadinhosAlerts, RankingPontuacao)
- Subscription realtime

Isso resulta em ~16 segundos para carregamento completo conforme observado na session replay.

### Solução: Consolidar métricas em uma única RPC

Em vez de 12+ queries `HEAD` separadas, criar uma RPC `get_dashboard_kpis` que retorna todos os contadores em uma única chamada ao banco.

### Arquivos afetados

1. **Nova migração SQL** — criar RPC `get_dashboard_kpis(p_brand_id uuid, p_period_start timestamptz)`
   - Retorna todas as contagens em um único `SELECT` com subqueries
   - Stores active, offers total/active, customers total/active, redemptions total/pending/period, machine_rides total/period, motoristas, achadinhos ativos/lojas/cidades, product_redemption_orders pending/month
   - Inclui pontos summary (elimina `get_points_summary` separado)

2. **`src/pages/Dashboard.tsx`**
   - Substituir as 12+ chamadas `useMetric` por uma única `useQuery` chamando a RPC
   - Manter os gráficos como queries separadas (dados maiores, não são contagens)
   - Adicionar `staleTime` nos gráficos para evitar refetch desnecessário

3. **Gráficos: adicionar `staleTime`**
   - As queries de gráficos (`redemptions-chart`, `earnings-chart`) podem ter `staleTime: 60_000` (1 min) para evitar refetch em navegação de volta

### Detalhes técnicos

**RPC `get_dashboard_kpis`:**
```sql
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
  p_brand_id uuid DEFAULT NULL,
  p_period_start timestamptz DEFAULT now() - interval '7 days',
  p_month_start timestamptz DEFAULT date_trunc('month', now())
)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'stores_active', (SELECT count(*) FROM stores WHERE is_active AND (p_brand_id IS NULL OR brand_id = p_brand_id)),
    'offers_total', (SELECT count(*) FROM offers WHERE (p_brand_id IS NULL OR brand_id = p_brand_id)),
    'offers_active', (SELECT count(*) FROM offers WHERE status = 'ACTIVE' AND is_active AND (p_brand_id IS NULL OR brand_id = p_brand_id)),
    -- ... demais contadores
  )
$$;
```

**Dashboard simplificado:**
```typescript
const { data: kpis } = useQuery({
  queryKey: ["dashboard-kpis", brandFilter, period],
  queryFn: async () => {
    const { data } = await supabase.rpc("get_dashboard_kpis", {
      p_brand_id: brandFilter || null,
      p_period_start: periodStart.toISOString(),
      p_month_start: monthStart.toISOString(),
    });
    return data;
  },
  staleTime: 30_000,
});
```

### Resultado esperado
- De ~20 requests HTTP para ~5 (1 RPC + 2 gráficos + realtime + lazy components)
- Tempo de carregamento estimado: 2-4 segundos em vez de 16

### O que NAO muda
- Layout visual do dashboard
- Realtime refresh (continua funcionando, invalidando a query da RPC)
- Componentes lazy (TasksSection, ActivityFeed)
- Gráficos (continuam separados, mas com staleTime)

