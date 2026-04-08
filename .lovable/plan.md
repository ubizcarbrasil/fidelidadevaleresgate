

## Painel da Cidade — Visão Completa da Arena Competitiva

### Objetivo
Dar ao administrador da cidade (Branch Admin) visibilidade total da jornada de duelos, apostas, ranking competitivo, cinturão e feed — tudo dentro do dashboard da cidade.

### Novos Arquivos

**1. `src/components/dashboard/branch/hook_branch_duelos.ts`**
- `useBranchDuelosStats(branchId)` — queries agregadas: duelos ativos, finalizados no mês, apostas abertas/matched, pontos em escrow, bônus 10% distribuído

**2. `src/components/dashboard/branch/BranchDuelosAtivos.tsx`**
- Lista duelos ao vivo/aceitos/pendentes com placar, nomes e status visual (badges)
- Reutiliza `useDuelosCidade` existente

**3. `src/components/dashboard/branch/BranchApostasResumo.tsx`**
- Resumo das apostas: abertas, matched, pontos em escrow, bônus distribuído
- Lista apostas ativas com valores e participantes

**4. `src/components/dashboard/branch/BranchRankingCompetitivo.tsx`**
- Top motoristas por corridas (reusa `useRankingCidade`)
- Campeão do cinturão em destaque (reusa `useCinturaoCidade`)

**5. `src/components/dashboard/branch/BranchFeedDuelos.tsx`**
- Timeline dos últimos eventos de duelos (desafios, aceites, resultados)
- Adapta a lógica do `FeedAtividadeCidade` para o admin

**6. `src/components/dashboard/branch/BranchArenaDuelos.tsx`**
- Componente orquestrador com banner "⚔️ Arena da Cidade"
- Agrupa KPIs de duelos + sub-cards acima
- Exibe somente quando há dados de duelos

### Modificação

**7. `src/components/dashboard/BranchDashboardSection.tsx`**
- Adicionar `<BranchArenaDuelos branchId={branchId} />` após o bloco de Ranking + Feed
- Condicional a `isDriverEnabled`

### Layout Visual
```text
┌────────────────────────────────┐
│ ⚔️ Arena Competitiva da Cidade │
├────────────────────────────────┤
│ KPIs: Ativos | Finalizados    │
│       Apostas | Escrow | Bônus│
├───────────────┬────────────────┤
│ Duelos ao     │ Ranking +      │
│ Vivo/Recentes │ Cinturão       │
├───────────────┴────────────────┤
│ Apostas Ativas (resumo)       │
├────────────────────────────────┤
│ Feed de Atividades (timeline) │
└────────────────────────────────┘
```

### Destaques Técnicos
- Reutiliza hooks existentes: `useDuelosCidade`, `useRankingCidade`, `useCinturaoCidade`
- Hook novo apenas para métricas agregadas (contagens e somas)
- Realtime via os mesmos channels já configurados
- Sem necessidade de novas tabelas ou RPCs — tudo via queries client-side filtradas por `branch_id`

