

## Plano: Adicionar KPIs de Motoristas na Dashboard

### O que será adicionado

Três novos cards KPI na Dashboard, logo abaixo dos 4 KPIs existentes:

1. **Motoristas** — contagem de clientes com tag `[MOTORISTA]` no nome
2. **Pontos Motoristas** — soma de `driver_points_credited` da tabela `machine_rides` (status `FINALIZED`)
3. **Pontos Clientes** — soma de `points_credited` da tabela `machine_rides` (status `FINALIZED`)

### Alterações

**`src/pages/Dashboard.tsx`**

1. Adicionar query para contar motoristas:
   - `useMetric("customers", true, (q) => q.ilike("name", "%[MOTORISTA]%"), "drivers", brandFilter)`

2. Adicionar duas queries com `useQuery` para somar pontos (não dá para usar `useMetric` pois precisa de `SUM`):
   - Query 1: `SELECT COALESCE(SUM(driver_points_credited), 0)` de `machine_rides` onde `ride_status = 'FINALIZED'`
   - Query 2: `SELECT COALESCE(SUM(points_credited), 0)` de `machine_rides` onde `ride_status = 'FINALIZED'`
   - Ambas com filtro de `brand_id` e período

3. Adicionar uma nova linha de 3 KPI cards entre os KPIs existentes (linha 698) e o gráfico de Visão Geral (linha 700), usando o mesmo componente `KpiCard` já existente:
   - Ícone `Car` para Motoristas
   - Ícone `Coins` para Pontos Motoristas  
   - Ícone `UserCheck` para Pontos Clientes

### Detalhes técnicos

Como o Supabase JS client não suporta `SUM` diretamente via `.select()`, vou usar uma RPC ou fazer a soma client-side buscando apenas as colunas necessárias (`driver_points_credited`, `points_credited`) com limit adequado. Alternativa mais robusta: criar uma função SQL `get_points_summary` que retorna as somas.

A abordagem mais simples e sem migração: buscar os valores das colunas e somar no client (já existe padrão similar com `fetchChartData` que busca até 5000 rows).

