## Plano: Painel da Cidade — Visão Completa da Arena Competitiva

### Objetivo
Dar ao administrador da cidade (Branch Admin) visibilidade total da jornada de duelos, apostas, ranking competitivo, cinturão e feed de atividades — tudo dentro do dashboard da cidade.

### Novos Componentes

**1. `src/components/dashboard/branch/BranchArenaDuelos.tsx`**
- Componente orquestrador que agrupa os sub-cards da arena no dashboard da cidade
- Recebe `branchId` e reutiliza os hooks existentes (`useDuelosCidade`, `useRankingCidade`, `useCinturaoCidade`, `useSideBets`)
- Visual de seção com banner similar ao do dashboard do motorista ("⚔️ Arena da Cidade")

**2. `src/components/dashboard/branch/BranchDuelosAtivos.tsx`**
- Lista de duelos ao vivo/aceitos/pendentes da cidade
- Mostra placar em tempo real (reutiliza `useContagemCorridasDuelo`)
- Status visual (ao vivo, pendente, finalizado) com badges coloridas
- Contagem total de duelos ativos e finalizados no mês

**3. `src/components/dashboard/branch/BranchApostasResumo.tsx`**
- Resumo das apostas ativas na cidade: total de apostas abertas, matched e pontos em escrow
- Lista das apostas em andamento com valores e status
- Total de pontos movimentados em apostas no mês
- Bônus 10% distribuído para vencedores de duelos

**4. `src/components/dashboard/branch/BranchRankingCompetitivo.tsx`**
- Top motoristas por corridas (reusa `useRankingCidade`)
- Exibe posição, nome, corridas e avatar/nickname
- Campeão do cinturão destacado no topo (reusa `useCinturaoCidade`)

**5. `src/components/dashboard/branch/BranchFeedDuelos.tsx`**
- Timeline dos últimos eventos de duelos (desafios, aceites, resultados, recusas)
- Reutiliza a lógica do `FeedAtividadeCidade` adaptada para o admin
- Mostra últimos 20 eventos com ícones e timestamps

### Hooks Novos

**6. `src/components/dashboard/branch/hook_branch_duelos.ts`**
- `useBranchDuelosStats(branchId)` — query que retorna contagens agregadas: duelos ativos, finalizados no mês, total de apostas, pontos em escrow, bônus distribuído
- Query direta nas tabelas `driver_duels` e `duel_side_bets` filtrada por `branch_id`

### Modificações

**7. `src/components/dashboard/BranchDashboardSection.tsx`**
- Adicionar `<BranchArenaDuelos branchId={branchId} />` após a seção de Ranking + Feed
- Só exibir quando `isDriverEnabled` for true (duelos só existem no modelo motorista)

### Estrutura Visual

```text
┌────────────────────────────────┐
│ ⚔️ Arena Competitiva da Cidade │
├────────────────────────────────┤
│ KPIs: Duelos Ativos | Apostas  │
│        Pontos Escrow | Bônus   │
├───────────────┬────────────────┤
│  Duelos Ao    │  Ranking +     │
│  Vivo/Recentes│  Cinturão      │
├───────────────┴────────────────┤
│  Apostas Ativas (resumo)       │
├────────────────────────────────┤
│  Feed de Atividades (timeline) │
└────────────────────────────────┘
```

### Resultado
- O admin da cidade vê tudo: duelos ao vivo, placares, apostas, ranking, cinturão e feed
- Reutiliza hooks existentes dos motoristas sem duplicação de lógica
- Um hook novo para métricas agregadas específicas do painel admin
