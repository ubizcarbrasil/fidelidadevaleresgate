

## Plano: Relatório e Indicadores de Resgates de Produtos

### Objetivo
Adicionar um relatório completo de resgates de produtos na página de relatórios existente (`ReportsPage.tsx`) e criar KPIs dedicados no dashboard, cobrindo métricas operacionais e analíticas.

### 1. Novo tipo de relatório: "Resgates de Produtos"

**Arquivo**: `src/pages/ReportsPage.tsx`

Adicionar `product_redemptions` como novo `ReportType` no seletor de relatórios:
- Buscar dados de `product_redemption_orders` filtrado por `brand_id` e período
- Colunas: Data, Produto, Cliente/Motorista, Origem (driver/customer), Pontos, Status, Cidade, Rastreio, Link ML
- Exportação CSV completa com todos os campos

### 2. Painel de indicadores (Summary Card) para resgates de produtos

**Arquivo**: `src/pages/ReportsPage.tsx` (novo componente inline `ProductRedemptionSummary`)

Quando o relatório selecionado for `product_redemptions`, exibir cards com:
- **Total de pedidos** no período
- **Total de pontos gastos** (soma de `points_spent`)
- **Por status**: quantos Pendentes, Aprovados, Enviados, Entregues, Rejeitados
- **Por origem**: % Motorista vs % Cliente
- **Tempo médio de processamento** (diff entre `created_at` e `reviewed_at`)
- **Top 5 produtos mais resgatados** (agrupado por título do snapshot)

### 3. Gráficos na aba "Gráficos"

**Arquivo**: `src/pages/ReportsPage.tsx` (dentro de `ChartsTab`)

Adicionar seção de gráficos específicos para resgates de produtos:
- **Linha temporal**: resgates por dia no período selecionado
- **Pizza**: distribuição por status
- **Barras**: top 10 produtos mais resgatados
- **Barras empilhadas**: motorista vs cliente por semana

### 4. KPIs no Dashboard principal

**Arquivo**: `src/components/dashboard/DashboardKpiSection.tsx`

Adicionar card de KPI "Resgates de Produtos" com:
- Total de pedidos pendentes (destaque vermelho se > 0)
- Total do mês atual
- Comparativo com mês anterior (trend)

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/ReportsPage.tsx` | Novo tipo `product_redemptions` + Summary + gráficos |
| `src/components/dashboard/DashboardKpiSection.tsx` | Novo KPI card de resgates de produto |

### Detalhes técnicos
- Sem migração SQL — todos os dados já existem em `product_redemption_orders`
- Reutiliza o padrão de `ReportType` e `downloadCSV` existentes
- Os gráficos usam Recharts já importado na página
- O snapshot do produto é extraído de `deal_snapshot_json` (mesmo padrão usado em `ProductRedemptionOrdersPage`)

