

## Plano: Corrigir KPIs do Dashboard (Pontuações zeradas)

### Diagnóstico

O card "Pontuações" consulta a tabela `earning_events`, que está **vazia** (0 registros). Os dados reais de pontuação estão na tabela `machine_rides` (3.204 corridas, 2.216 nos últimos 7 dias). O webhook grava em `machine_rides` e `points_ledger`, nunca em `earning_events`.

O card "Resgates" mostra 2 corretamente — existem apenas 2 redemptions no banco.

### Correção

**Arquivo:** `src/pages/Dashboard.tsx`

1. Trocar a fonte de dados do KPI "Pontuações" de `earning_events` para `machine_rides`
   - `earningEventsTotal` → consultar `machine_rides` filtrado por `brand_id` e `ride_status = 'FINISHED'`
   - `earningEventsPeriod` → mesma tabela com filtro de período
   - Trocar `color="warning"` para `color="primary"` (resolve o ícone amarelo também)

2. Trocar a fonte dos gráficos "Pontuações" de `earning_events` para `machine_rides`
   - A query `fetchChartData("earning_events")` passa a ser `fetchChartData("machine_rides")` com filtro adicional de `ride_status = 'FINISHED'`

3. Ajustar `fetchChartData` para aceitar filtro extra opcional (ride_status)

### O que muda visualmente
- O card "Pontuações" passa a mostrar o número real de corridas finalizadas
- O gráfico "Visão Geral" mostrará dados de corridas no eixo "Pontuações"
- O ícone do card "Pontuações" ficará azul em vez de amarelo

### Detalhes técnicos
- A função `useMetric` já suporta filtros customizados, basta adicionar `.eq("ride_status", "FINISHED")` ao filtro
- Para o gráfico, `fetchChartData` precisa de um parâmetro opcional para adicionar filtros extras na query
- Nenhuma migração de banco necessária

