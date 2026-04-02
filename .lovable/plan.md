

# Complementar o Painel do Franqueado (Cidade)

## Estado Atual

Depois de analisar todo o codebase, boa parte da infraestrutura ja existe:

| Funcionalidade | Status | Observacao |
|---|---|---|
| Carteira de Pontos | Existe | `BranchWalletPage.tsx` com saldo, recargas e historico |
| Regras de Pontos | Existe | `DriverPointsRulesPage.tsx` com 4 modos (PER_REAL, PERCENT, FIXED, VOLUME_TIERS) |
| Motoristas | Existe | `DriverManagementPage.tsx` com listagem, busca, detalhe e scoring manual |
| Produtos de Resgate | Existe | `ProdutosResgatePage.tsx` |
| Pedidos de Resgate | Existe | `ProductRedemptionOrdersPage.tsx` |
| Manuais | Existe | `ManuaisPage.tsx` com ManualRenderer |
| Dashboard Branch | Parcial | `BranchDashboardSection` com 5 KPIs + ranking, mas faltam varios blocos |
| Menu Lateral Branch | Existe | `BranchSidebar.tsx` com todos os items no grupo "Achadinhos Motorista" |
| Atalho no Empreendedor | Existe | `DashboardQuickLinks` com "Painel Franqueado" |
| Ambiente Demo/Teste | Nao existe | |
| Relatorios da Cidade | Nao existe | Rota /reports existe mas nao e scoped por cidade |

## O Que Falta Implementar

### 1. Dashboard Expandido do Franqueado (Prioridade Alta)
O `BranchDashboardSection` atual so tem 5 KPIs basicos e ranking. Faltam:

**Novos blocos:**
- **Resgates detalhado**: total, pendentes, aprovados, concluidos, rejeitados
- **Pontuacao motorista**: total distribuido, hoje, mes, media por motorista
- **Motoristas detalhado**: cadastrados, pontuados, que ja resgataram
- **Corridas detalhado**: total, hoje, mes, media por motorista
- **Visao geral da cidade**: saldo carteira, campanhas/regras ativas, status operacional
- **Pontuacao em tempo real**: feed de corridas finalizadas via Supabase Realtime

**Tecnico:**
- Criar nova RPC `get_branch_dashboard_stats_v2` com todos os indicadores
- Expandir `BranchDashboardSection` com componentes separados por bloco
- Adicionar canal realtime para `machine_rides` filtrado por `branch_id`
- Quando `consoleScope === "BRANCH"`, ocultar os KPIs genericos do dashboard e mostrar apenas o dashboard dedicado

### 2. Carteira de Pontos - Melhorias (Prioridade Media)
O modulo existe mas falta:
- **Pontos reservados**: conceito de pontos reservados/comprometidos
- **Alerta de saldo baixo**: notificacao visual quando saldo < threshold configuravel
- **Historico de consumo separado**: tab de distribuicoes vs recargas

**Tecnico:**
- Adicionar coluna `low_balance_threshold` em `branch_points_wallet`
- Adicionar componente de alerta condicional na pagina

### 3. Ambiente de Demonstracao (Prioridade Media)
No painel do empreendedor, criar:
- Botao "Acessar como Franqueado" que abre o painel em modo leitura/demo
- Exibicao de credenciais de teste (se existir usuario teste vinculado)

**Tecnico:**
- Criar componente `DemoAccessCard` no dashboard do Brand
- Logica de impersonacao ou link direto para o painel Branch com brandId

### 4. Relatorios da Cidade (Prioridade Baixa)
Criar pagina de relatorios scoped por `branch_id`:
- Exportacao CSV de motoristas, corridas, pontuacao
- Resumo mensal

### 5. Manuais do Franqueado - Conteudo (Prioridade Baixa)
A infraestrutura existe. Faltam manuais especificos:
- Como usar a Carteira de Pontos
- Como configurar Regras de Pontos
- Como aprovar Pedidos de Resgate
- Como acompanhar Motoristas

**Tecnico:**
- Adicionar entradas no array de manuais em `src/components/manuais/`

---

## Plano de Implementacao (Ordem Sugerida)

### Fase 1 - Dashboard Completo do Franqueado
1. Criar migration com RPC `get_branch_dashboard_stats_v2` retornando todos os indicadores detalhados
2. Refatorar `BranchDashboardSection` em componentes menores:
   - `BranchKpiResgates`
   - `BranchKpiPontuacao`
   - `BranchKpiMotoristas`
   - `BranchKpiCorridas`
   - `BranchVisaoGeral`
   - `BranchRankingMotoristas` (ja existe parcialmente)
   - `BranchFeedTempoReal`
3. Quando scope = BRANCH, renderizar dashboard dedicado em vez do generico
4. Adicionar realtime subscription para feed de pontuacao

### Fase 2 - Melhorias na Carteira
5. Migration: adicionar `low_balance_threshold` na `branch_points_wallet`
6. Componente de alerta de saldo baixo
7. Tabs para filtrar historico (recargas vs distribuicoes)

### Fase 3 - Manuais e Demo
8. Adicionar conteudo dos manuais do franqueado
9. Criar card de acesso demo no dashboard do empreendedor

### Fase 4 - Relatorios
10. Criar `BranchReportsPage` com exportacao CSV

---

## Arquivos Principais a Criar/Modificar

| Arquivo | Acao |
|---|---|
| DB migration | Nova RPC `get_branch_dashboard_stats_v2` |
| `src/components/dashboard/BranchDashboardSection.tsx` | Refatorar e expandir |
| `src/components/dashboard/branch/` | Novos componentes por bloco |
| `src/pages/Dashboard.tsx` | Condicional: dashboard dedicado para BRANCH |
| `src/pages/BranchWalletPage.tsx` | Alerta saldo baixo + tabs |
| `src/components/manuais/dados_manuais_franqueado.ts` | Conteudo dos manuais |
| `src/components/dashboard/DemoAccessCard.tsx` | Card acesso demo |
| DB migration | `low_balance_threshold` column |

**Estimativa**: ~15 arquivos entre criacao e edicao. A Fase 1 (Dashboard) e a mais impactante e deve ser priorizada.

