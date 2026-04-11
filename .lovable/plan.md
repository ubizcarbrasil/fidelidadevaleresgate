

## Plano: Gráfico de corridas por dia no dashboard da cidade

### Objetivo
Adicionar um gráfico de barras mostrando a quantidade de corridas finalizadas por dia (últimos 14 dias) no dashboard da cidade (branch), logo abaixo dos KPIs de motorista.

### Mudanças

#### 1. Novo hook `useBranchRidesPerDay` em `hook_branch_dashboard.ts`
- Query na tabela `machine_rides` filtrando por `branch_id`, `ride_status = 'FINALIZED'` e últimos 14 dias
- Seleciona apenas `finalized_at`, agrupa por dia no client-side
- Retorna array `{ day: "dd/MM", rides: number }[]`

#### 2. Novo componente `BranchGraficoCorridasDia.tsx`
- Recebe os dados do hook
- Renderiza um `BarChart` (recharts) com eixo X = dia, eixo Y = quantidade
- Card com título "Corridas por dia (últimos 14 dias)"
- Skeleton durante loading
- Segue o mesmo padrão visual dos gráficos existentes no `BrandSettingsPage`

#### 3. Integração no `BranchDashboardSection.tsx`
- Chamar o novo hook passando `branchId`
- Inserir o componente `BranchGraficoCorridasDia` logo após os KPIs de motorista (entre os KPIs e a Visão Geral), dentro do bloco `isDriverEnabled`

### Arquivos envolvidos
- `src/components/dashboard/branch/hook_branch_dashboard.ts` — novo hook
- `src/components/dashboard/branch/BranchGraficoCorridasDia.tsx` — novo componente
- `src/components/dashboard/BranchDashboardSection.tsx` — integração

