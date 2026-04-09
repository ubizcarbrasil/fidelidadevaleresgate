

# Auditoria: Funcionalidades construídas que faltam no painel do empreendedor

## Diagnóstico

Após análise completa da codebase, identifiquei **5 lacunas** entre o que foi implementado e o que está acessível no painel do empreendedor (BrandSidebar + GamificacaoAdminPage + Dashboard):

---

### 1. Apostas Laterais (Side Bets) — sem visibilidade no admin

**O que existe**: Sistema completo de apostas laterais no app do motorista (`hook_apostas_duelo.ts`, `CriarApostaSheet.tsx`, `ApostasDuelo.tsx`, `NegociacaoContrapropostaCard.tsx`), com escrow, contrapropostas, e settlements. O `BranchArenaDuelos` no dashboard da **cidade** (Branch scope) mostra KPIs de apostas (abertas, matched, pontos em escrow).

**O que falta**: A página `GamificacaoAdminPage` (acessada pelo empreendedor) **não tem nenhuma aba ou seção de apostas laterais**. As abas são: Configuração, Duelos, Ranking, Cinturão, Moderação. Não há como o empreendedor ver, moderar ou acompanhar apostas.

**Ação**: Adicionar uma aba "Apostas" na `GamificacaoAdminPage` com:
- KPIs de apostas (abertas, matched, settled, pontos em escrow)
- Lista de apostas com status e filtros
- Ações de moderação (cancelar aposta suspeita)

---

### 2. Ranking de Apostadores — sem visibilidade no admin

**O que existe**: `RankingApostadoresSheet.tsx` e `hook_ranking_apostadores.ts` com RPC `get_side_bet_ranking` — tudo funcional no app do motorista. O `CardRankingApostador.tsx` mostra estatísticas detalhadas (acertos, win rate, net points).

**O que falta**: A aba "Ranking" do admin (`RankingAdminView`) mostra apenas o ranking de pontos dos motoristas. Não há visualização do ranking de apostadores.

**Ação**: Adicionar uma seção ou sub-aba "Ranking de Apostadores" no `RankingAdminView` ou na nova aba "Apostas".

---

### 3. Feed de Duelos em tempo real — ausente no admin

**O que existe**: `BranchFeedDuelos.tsx` mostra feed em tempo real de atividades de duelos no dashboard da cidade. No app do motorista, `FeedAtividadeCidade.tsx` e `servico_feed_cidade.ts` fornecem feed completo.

**O que falta**: A `GamificacaoAdminPage` não tem um feed de atividade em tempo real. O admin só vê lista estática de duelos.

**Ação**: Adicionar componente de feed ao vivo na `GamificacaoAdminPage` (reutilizar lógica do `BranchFeedDuelos` ou `DuelosAoVivoAdmin`).

---

### 4. Estatísticas de Apostas no Dashboard principal

**O que existe**: O Dashboard principal (`Dashboard.tsx`) tem banners de CRM e Gamificação para BRAND scope, mas nenhum KPI de apostas. O `BranchArenaDuelos` só aparece no scope BRANCH.

**O que falta**: Para empreendedores (BRAND scope), não há nenhum indicador de apostas no dashboard principal — nem KPIs agregados, nem um banner resumo.

**Ação**: Adicionar card/KPI resumo de apostas no dashboard do empreendedor (total em escrow, apostas ativas cross-city).

---

### 5. Relatório de mensagens de apostas — parcial

**O que existe**: Os event types `SIDE_BET_CREATED` e `SIDE_BET_ACCEPTED` foram adicionados aos fluxos e ao relatório de mensagens (feito nesta sessão).

**O que falta**: Validar que o relatório de mensagens filtra e exibe corretamente entregas desses novos tipos. Não há mais lacuna de código, mas pode precisar de verificação funcional.

**Status**: Já implementado. Apenas verificação necessária.

---

## Plano de implementação

### Etapa 1: Nova aba "Apostas" na GamificacaoAdminPage
- Criar `ApostasAdminView.tsx` em `src/components/admin/gamificacao/`
- Query `duel_side_bets` filtrando por `branch_id`, com filtros de status
- KPIs: abertas, matched, settled, canceladas, pontos em escrow, bonus distribuído
- Tabela de apostas com detalhes (apostador A/B, pontos, status, duelo vinculado)
- Botão de cancelamento/moderação para apostas suspeitas
- Adicionar `TabsTrigger` "Apostas" na `GamificacaoAdminPage`

### Etapa 2: Ranking de Apostadores no admin
- Criar `RankingApostadoresAdmin.tsx` em `src/components/admin/gamificacao/`
- Reutilizar RPC `get_side_bet_ranking` já existente
- Exibir dentro da nova aba "Apostas" como seção inferior ou como sub-aba do ranking

### Etapa 3: KPI de apostas no Dashboard do empreendedor
- Adicionar card compacto no `DashboardKpiSection` ou abaixo do banner de Gamificação
- Mostrar: apostas ativas (total cross-city), pontos em escrow agregados
- Query agregada por `brand_id` nas `duel_side_bets`

### Etapa 4: Ajuste no grid de abas
- A `GamificacaoAdminPage` passará de 5 para 6 abas: Configuração, Duelos, **Apostas**, Ranking, Cinturão, Moderação
- Ajustar `grid-cols-5` para `grid-cols-6` no TabsList

