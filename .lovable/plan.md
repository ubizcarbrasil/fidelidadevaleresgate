

# Corrigir Dashboard do Franqueado — Mostrar Apenas KPIs da Cidade

## Problema

Quando o franqueado (BRANCH) acessa o Dashboard, o sistema renderiza os KPIs genéricos (`DashboardKpiSection`) que fazem queries diretas nas tabelas. Mesmo com as permissões adicionadas, esses KPIs são genéricos e não representam a operação da cidade. O `BranchDashboardSection` (que usa a RPC SECURITY DEFINER com dados corretos) aparece abaixo, mas o franqueado vê zeros no topo.

## Solução

Quando `consoleScope === "BRANCH"`, ocultar os componentes genéricos (KPIs, Charts, RidesCounter, CRM banner, Tasks/Activity) e exibir **somente** o `BranchDashboardSection` com o header e seletor de tempo real. Isso garante que o franqueado veja apenas os dados da sua cidade, processados pela RPC dedicada.

## Arquivo a Modificar

| Arquivo | Acao |
|---|---|
| `src/pages/Dashboard.tsx` | Condicionar renderização: se BRANCH, mostrar apenas header + BranchDashboardSection. Ocultar DashboardKpiSection, Charts, RidesCounter, Tasks/Activity e CRM banner. |

## Detalhamento Tecnico

No `Dashboard.tsx`, envolver os blocos genéricos com `{consoleScope !== "BRANCH" && (...)}`:
- `DashboardKpiSection` (linha ~278)
- `RidesCounterCard` (linha ~303)
- `DashboardChartsSection` (linha ~306)
- `Tasks + Activity Feed` (linha ~317)
- `CRM Banner` (linha ~323)

O `BranchDashboardSection` (linha ~298) permanece como está, renderizado quando `consoleScope === "BRANCH"`.

Impacto: 1 arquivo, apenas condicionais de renderização. Nenhuma mudança de banco ou componentes.

