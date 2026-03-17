

## Plano: Redesign SaaS Premium do Painel Administrativo

### Escopo
Redesign completo da camada visual do painel admin com estética dark-mode premium inspirada em Stripe/Linear/Vercel. Apenas apresentação — nenhuma lógica de negócio, rota ou estrutura de dados será alterada.

### Paleta de Cores
Substituir os CSS tokens em `src/index.css` pela paleta solicitada:
- Background: `#0F172A` / `#111827`
- Cards: `#1E293B`, Bordas: `#334155`
- Texto: `#F8FAFC` / `#CBD5E1` / `#94A3B8`
- Primary: `#3B82F6`, Success: `#22C55E`, Warning: `#F59E0B`, Danger: `#EF4444`

### Alterações por Arquivo

#### 1. `src/index.css` — Tokens e utilitários
- Substituir variáveis `:root` e `.dark` pela nova paleta (manter ambos modos apontando para dark)
- Adicionar classes: `.saas-card`, `.saas-topbar`, `.saas-kpi`, `.saas-badge-*`
- Forçar `body` para dark mode por padrão com a classe `.dark` no `<html>`

#### 2. `src/components/AppLayout.tsx` — Layout + Topbar
- Adicionar topbar moderna com: campo de busca, seletor de cidade (BranchSelector já existe), ícone de notificação, avatar com iniciais do usuário e nome
- Header com `bg-[#111827]` e bordas `#334155`
- Manter SidebarProvider + Outlet intactos

#### 3. `src/components/consoles/BrandSidebar.tsx` — Sidebar Premium
- Estilizar com `bg-[#0F172A]` e bordas `#1E293B`
- Item ativo: fundo `#3B82F6/10` com borda lateral azul
- Manter menu items existentes (mapeiam para rotas reais), apenas aplicar novo visual
- Logo com glow sutil, footer com avatar circular

#### 4. `src/pages/Dashboard.tsx` — Dashboard Executivo Completo
Reestruturar o layout em 7 seções usando dados existentes:

**Seção A — KPIs** (4 cards no topo): Faturamento→Resgates no Período, Usuários Ativos→Clientes, Operações→Pontuações, Taxa de Conversão→Ofertas Ativas. Cada card com mini sparkline via Recharts `<Line>`, valor grande, badge de tendência `+12%`.

**Seção B — Gráfico Principal**: Card largo "Visão Geral" com gráfico de linha (Recharts `<LineChart>`) comparando resgates vs pontuações com seletor de período (já existe).

**Seção C — Ranking**: Card lateral usando dados de `stores` já carregados — ranking por parceiro com nome + contagem visual (barras horizontais).

**Seção D — Alertas**: Card com alertas operacionais mock (resgates pendentes, ofertas expirando, regras aguardando aprovação) — dados dos metrics `redemptionsPending`, `storeRulesPending` já disponíveis.

**Seção E — Heatmap**: Grid visual 7x5 representando atividade por dia da semana usando dados de `recentRedemptions` já carregados.

**Seção F — Tabela de Tarefas**: Tabela estilizada com badges coloridos (Em andamento/Concluído/Pendente) usando dados mock coerentes com a plataforma.

**Seção G — Atividades Recentes**: Timeline vertical minimalista com eventos mock (novo resgate, cliente cadastrado, oferta publicada) com timestamp relativo.

### Layout Grid
```text
┌────────────┬─────────────────────────────────────┐
│  SIDEBAR   │  TOPBAR (busca, notif, avatar)      │
│  #0F172A   ├─────────────────────────────────────┤
│            │  [KPI] [KPI] [KPI] [KPI]            │
│  Logo      ├──────────────────┬──────────────────┤
│  Menu      │  Gráfico Linha   │  Ranking lateral │
│  Items     │  (Visão Geral)   │  (Top Parceiros) │
│            ├──────────────────┼──────────────────┤
│            │  Alertas         │  Heatmap         │
│            ├──────────────────┴──────────────────┤
│            │  Tabela Tarefas                     │
│  Footer    │  Atividades Recentes               │
└────────────┴─────────────────────────────────────┘
```

### Arquivos a editar
- `src/index.css` — nova paleta e utilitários SaaS
- `src/components/AppLayout.tsx` — topbar premium
- `src/components/consoles/BrandSidebar.tsx` — sidebar dark elegante
- `src/pages/Dashboard.tsx` — dashboard com 7 seções
- `index.html` — adicionar classe `dark` ao `<html>` para forçar dark mode

### Restrição
Apenas camada visual. Hooks, queries, mutations, rotas, autenticação e banco de dados permanecem inalterados.

