

# Redesign Visual do Dashboard da Cidade (Branch) — Estilo Premium

## Objetivo
Atualizar o dashboard do franqueado para usar o mesmo visual premium do painel do empreendedor (referência nas imagens enviadas), usando o componente `KpiCard` com ícones coloridos, spark lines e layout em grid consistente.

## Estado Atual
O dashboard da cidade (`BranchDashboardSection`) usa Cards simples com texto plano e grids internos. O visual é funcional mas não tem o acabamento premium do painel do empreendedor que usa `KpiCard` com gradientes, spark lines e ícones em badges coloridos.

## Alterações

### 1. Refatorar `BranchDashboardSection.tsx` — Layout em KpiCards
Substituir os 4 blocos de KPIs agrupados (Resgates, Pontuação, Motoristas, Corridas) por KpiCards individuais no estilo do empreendedor:

**Linha superior (grid 2x2):**
- Resgates (total) — ícone `ReceiptText`, cor primary, sub com pendentes
- Pontuação Motorista (total) — ícone `Coins`, cor success
- Motoristas (cadastrados) — ícone `Car`, cor warning
- Corridas Realizadas (total) — ícone `Car`, cor primary

**Linha de detalhes (grid 1x3):**
- Pontos Hoje — ícone `Coins`, cor success
- Pontos Mês — ícone `Coins`, cor primary
- Média/Motorista — ícone `UserCheck`, cor violet

Manter `BranchVisaoGeral`, `BranchRankingMotoristas` e `BranchFeedTempoReal` como estão (já têm boa qualidade visual).

### 2. Atualizar componentes KPI individuais
- `BranchKpiResgates.tsx` → Simplificar para usar `KpiCard` com valor principal + sub com breakdown
- `BranchKpiPontuacao.tsx` → Usar `KpiCard` com total e sub "hoje: X | mês: Y"
- `BranchKpiMotoristas.tsx` → Usar `KpiCard` com total e sub "X pontuados | Y resgataram"
- `BranchKpiCorridas.tsx` → Usar `KpiCard` com total e sub "hoje: X | mês: Y"

### 3. Melhorar `BranchRankingMotoristas.tsx`
Adicionar medalhas (🥇🥈🥉), barra de progresso e badge de pontos — mesma aparência do `RankingPontuacao` do empreendedor.

### 4. Layout responsivo em `BranchDashboardSection.tsx`
```text
┌──────────────┬──────────────┐
│  Resgates    │  Pontuação   │  ← KpiCard grid 2x2
├──────────────┼──────────────┤     (mobile: 2 cols)
│  Motoristas  │  Corridas    │
└──────────────┴──────────────┘
┌────────┬────────┬──────────┐
│Pts Hoje│Pts Mês │Méd/Motor │  ← KpiCard grid 3 cols
└────────┴────────┴──────────┘     (mobile: 1 col)
┌─────────────────────────────┐
│  Visão Geral da Cidade      │  ← Carteira (já existente)
└─────────────────────────────┘
┌──────────────┬──────────────┐
│  Ranking     │  Feed Tempo  │  ← Já existentes
│  Motoristas  │  Real        │
└──────────────┴──────────────┘
```

## Arquivos Modificados

| Arquivo | Ação |
|---|---|
| `src/components/dashboard/BranchDashboardSection.tsx` | Reorganizar layout, usar KpiCard |
| `src/components/dashboard/branch/BranchKpiResgates.tsx` | Refatorar para KpiCard |
| `src/components/dashboard/branch/BranchKpiPontuacao.tsx` | Refatorar para KpiCard |
| `src/components/dashboard/branch/BranchKpiMotoristas.tsx` | Refatorar para KpiCard |
| `src/components/dashboard/branch/BranchKpiCorridas.tsx` | Refatorar para KpiCard |
| `src/components/dashboard/branch/BranchRankingMotoristas.tsx` | Adicionar medalhas e barras de progresso |

## Sem alterações de banco
Nenhuma migração necessária — os dados já são fornecidos pela RPC `get_branch_dashboard_stats_v2`.

