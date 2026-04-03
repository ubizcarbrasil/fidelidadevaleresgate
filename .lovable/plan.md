

## Plano: Dashboard do Franqueado — Modelo Passageiro (PASSENGER_ONLY)

### Problema
No modelo PASSENGER_ONLY, o dashboard mostra apenas 1 KPI (Resgates) isolado e o card "Visão Geral da Cidade" com dados de carteira de motorista — irrelevantes nesse contexto. A tela fica praticamente vazia.

### Solução

#### 1. Ocultar card "Visão Geral da Cidade" quando não há motorista
No `BranchDashboardSection.tsx`, renderizar `BranchVisaoGeral` apenas quando `isDriverEnabled === true`.

#### 2. Criar RPC para stats de passageiro
Criar uma migration com a função `get_branch_passenger_stats(p_branch_id)` que retorna:
- **Clientes cadastrados** — `COUNT(*)` de `customers` da branch
- **Clientes ativos** — clientes com pelo menos 1 resgate nos últimos 30 dias
- **Resgates do mês** — contagem de resgates do mês atual
- **Ofertas ativas** — contagem de `offers` ativas da branch
- **Lojas parceiras** — contagem de `stores` ativas da branch

#### 3. Criar KPIs de passageiro (novos componentes)
Dentro de `src/components/dashboard/branch/`:
- `BranchKpiClientesCadastrados.tsx` — total de clientes
- `BranchKpiClientesAtivos.tsx` — clientes ativos (30 dias)
- `BranchKpiOfertasAtivas.tsx` — ofertas disponíveis
- `BranchKpiLojasParceiras.tsx` — lojas parceiras

Todos usando o componente `KpiCard` existente, com ícones e cores diferenciados.

#### 4. Atualizar `BranchDashboardSection.tsx`
- Quando `isPassengerEnabled && !isDriverEnabled`: exibir grid 2x2 com Resgates + Clientes Cadastrados + Clientes Ativos + Ofertas Ativas
- Quando `isDriverEnabled && isPassengerEnabled` (BOTH): exibir ambos os grids
- Manter lógica atual para `isDriverEnabled`

#### 5. Criar hook e tipos
- Novo hook `useBranchPassengerStats(branchId)` para buscar a RPC
- Expandir `tipos_branch_dashboard.ts` com interface `BranchPassengerStats`

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | Migration SQL com RPC `get_branch_passenger_stats` |
| Criar | `src/components/dashboard/branch/BranchKpiClientesCadastrados.tsx` |
| Criar | `src/components/dashboard/branch/BranchKpiClientesAtivos.tsx` |
| Criar | `src/components/dashboard/branch/BranchKpiOfertasAtivas.tsx` |
| Criar | `src/components/dashboard/branch/BranchKpiLojasParceiras.tsx` |
| Editar | `src/components/dashboard/branch/tipos_branch_dashboard.ts` |
| Editar | `src/components/dashboard/branch/hook_branch_dashboard.ts` |
| Editar | `src/components/dashboard/BranchDashboardSection.tsx` |

### Detalhe técnico
- A RPC `get_branch_passenger_stats` é separada da `get_branch_dashboard_stats_v2` para manter retrocompatibilidade
- O hook `useBranchScoringModel()` já existe e retorna `isDriverEnabled` e `isPassengerEnabled` — será usado para controlar a visibilidade
- Nenhuma alteração em Edge Functions ou lógica de backend existente

