

# Filtrar Dashboard do Franqueado por Modelo de Negócio

## Problema
O dashboard do franqueado exibe KPIs, ranking e feed de motoristas mesmo quando o modelo de negócio está configurado como PASSENGER_ONLY (cliente). Os componentes de motorista (Motoristas, Corridas, Pontos Hoje/Mês/Média, Ranking Motoristas, Feed Tempo Real) devem ser ocultados quando o modelo não inclui motoristas.

## Solução
Usar o hook `useBranchScoringModel` no `BranchDashboardSection` para condicionar a exibição dos componentes por modelo de negócio.

## Arquivo a modificar
- `src/components/dashboard/BranchDashboardSection.tsx`

## Mudanças

### BranchDashboardSection.tsx
1. Importar `useBranchScoringModel`
2. Obter `isDriverEnabled` e `isPassengerEnabled`
3. Condicionar a renderização:

**Componentes de MOTORISTA** (só aparecem se `isDriverEnabled`):
- `BranchKpiMotoristas`
- `BranchKpiCorridas`
- `BranchKpiPontuacao` (pontos de motorista)
- `BranchKpiPontosHoje`
- `BranchKpiPontosMes`
- `BranchKpiMediaMotorista`
- `BranchRankingMotoristas`
- `BranchFeedTempoReal`

**Componentes NEUTROS** (sempre visíveis):
- `BranchKpiResgates`
- `BranchVisaoGeral`

4. Ajustar o grid para se adaptar quando há menos cards (ex: se só tem Resgates no grid principal, usar `grid-cols-1` em vez de `grid-cols-2`)

