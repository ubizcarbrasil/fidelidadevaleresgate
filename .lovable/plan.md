

## Plano: CRM Completo como Módulo Nativo do Empreendedor

### Contexto
O CRM externo (valeresgatacrm) possui ~30 páginas com funcionalidades complexas baseadas em um modelo de dados de mobilidade (corridas, tiers por frequência de corridas). O sistema de fidelidade atual tem um modelo diferente (pontos, resgates, ofertas). O plano adapta as funcionalidades mais relevantes do CRM ao modelo de dados existente.

### Funcionalidades a Construir

#### 1. Dashboard CRM Expandido (reformular `CrmDashboardPage.tsx`)
- Gráficos com **recharts** (já instalado): evolução de clientes por mês, distribuição por status, pontuações vs resgates ao longo do tempo
- Cards de resumo aprimorados com tendência (seta subindo/descendo)
- Seção "Cenário Crítico": morno (30-45 dias), frio (45-60 dias), perdidos (60+), não convertidos (0 resgates)
- Score de saúde visual com gauge chart

#### 2. Página de Clientes CRM (`CrmCustomersPage.tsx`) — NOVA
- Tabela completa paginada com busca e filtros (status, faixa de pontos, período de inatividade)
- Drawer de detalhe do cliente: histórico de pontuações, resgates, timeline de atividade
- Exportação Excel/PDF (jspdf-autotable já instalado)
- Ordenação por colunas (nome, pontos, dias inativo, total earnings)

#### 3. Análise Pareto (`CrmParetoPage.tsx`) — NOVA
- Identificar os 20% de clientes que geram 80% das pontuações
- Cards: total do grupo Pareto, % de pontuações, média de pontos, frequência média
- Tabela dos top clientes com métricas
- Gráfico de distribuição acumulada

#### 4. Oportunidades de Engajamento (`CrmOpportunitiesPage.tsx`) — NOVA
- Segmentos automáticos baseados no modelo de fidelidade:
  - "Alta frequência sem resgate" (muitas pontuações, 0 resgates)
  - "Alto saldo parado" (>X pontos, inativo 15+ dias)
  - "Resgatador ativo esfriando" (tinha resgates frequentes, desacelerando)
  - "Novo cliente promissor" (<30 dias, já pontuou 3+ vezes)
- Cards com contagem e ação rápida "Ver clientes"

#### 5. Jornada do Cliente (`CrmJourneyPage.tsx`) — NOVA
- Visualização Kanban/funil das etapas: Novo → Engajando → Fiel → Em Risco → Perdido
- Contagem de clientes em cada estágio
- Transições recentes (quem mudou de estágio nos últimos 7 dias — calculado comparando atividade)

#### 6. Reformular Clientes Perdidos (`CrmLostCustomersPage.tsx`)
- Adicionar buckets visuais tipo cards (30-45d, 45-60d, 60-90d, 90+d) com contagem
- Botão de exportar lista em Excel/PDF

#### 7. Reformular Clientes Potenciais (`CrmPotentialCustomersPage.tsx`)
- Adicionar aba "Pareto" além das existentes
- Métricas visuais de oportunidade por aba

#### 8. Hook expandido (`useCrmAnalytics.ts`)
- Adicionar métricas: earning_events por mês (últimos 6 meses), redemptions por mês
- Adicionar cálculos Pareto (top 20% por total_earnings)
- Adicionar segmentos de oportunidade
- Adicionar dados de jornada/funil

---

### Integração no Sistema

#### Sidebar — Reorganizar grupo CRM
```
📊 CRM Estratégico
  ├── Dashboard CRM        /crm
  ├── Clientes CRM         /crm/customers
  ├── Oportunidades        /crm/opportunities
  ├── Análise Pareto       /crm/pareto
  ├── Jornada do Cliente   /crm/journey
  ├── Clientes Perdidos    /crm/lost
  └── Clientes Potenciais  /crm/potential
```

#### Rotas — `App.tsx`
Adicionar rotas: `/crm/customers`, `/crm/opportunities`, `/crm/pareto`, `/crm/journey`

#### Module Guard
Proteger todas as rotas CRM com `moduleKey: "crm"` e registrar módulo `crm` no catálogo (migration SQL).

---

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useCrmAnalytics.ts` | Expandir — métricas mensais, Pareto, oportunidades, jornada |
| `src/pages/CrmDashboardPage.tsx` | Reformular — gráficos recharts, cenário crítico |
| `src/pages/CrmCustomersPage.tsx` | Criar — tabela completa com busca/filtros/detalhe/export |
| `src/pages/CrmParetoPage.tsx` | Criar — análise 80/20 |
| `src/pages/CrmOpportunitiesPage.tsx` | Criar — segmentos de engajamento |
| `src/pages/CrmJourneyPage.tsx` | Criar — funil/Kanban de jornada |
| `src/pages/CrmLostCustomersPage.tsx` | Reformular — buckets visuais + export |
| `src/pages/CrmPotentialCustomersPage.tsx` | Reformular — aba Pareto + métricas |
| `src/components/consoles/BrandSidebar.tsx` | Editar — grupo CRM dedicado |
| `src/App.tsx` | Editar — novas rotas |
| Migration SQL | Criar — módulo `crm` em `module_definitions` |

### Notas
- Zero migrações de tabelas: usa `customers`, `earning_events`, `redemptions` existentes
- Gráficos com `recharts` (já instalado)
- Export PDF com `jspdf-autotable` (já instalado)
- Dados filtrados por `brand_id` via `useBrandGuard`
- RLS existente já cobre todos os acessos necessários

