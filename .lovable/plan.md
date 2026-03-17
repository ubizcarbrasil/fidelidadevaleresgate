

## Plano: Refinamento Premium do Painel Administrativo

### Melhorias Identificadas

Analisando o estado atual do código e o screenshot (apenas loading spinner visível no mobile), há oportunidades claras de refinamento:

### 1. KPI Cards com Sparklines Reais (`src/pages/Dashboard.tsx`)
- Adicionar mini sparklines (Recharts `<Line>`) dentro de cada KPI card usando os dados de `recentRedemptions`/`recentEarnings` já carregados
- Adicionar badge de tendência calculado (comparar primeira metade vs segunda metade do período)
- Background com gradiente sutil por cor do KPI

### 2. Topbar Mais Rica (`src/components/AppLayout.tsx`)
- Adicionar breadcrumb dinâmico baseado no `location.pathname`
- Dropdown funcional no avatar (com opções: Perfil, Alterar Senha, Sair)
- Animação suave no sino de notificação quando há pendências
- Search com `Cmd+K` hint visual

### 3. Sidebar Refinada (`src/components/consoles/BrandSidebar.tsx`)
- Adicionar contador de notificações inline mais elegante (dot ao invés de badge grande)
- Scroll indicator sutil quando sidebar tem overflow
- Transição suave no collapse/expand dos grupos
- Separador visual com gradiente entre grupos

### 4. Dashboard Layout Aprimorado (`src/pages/Dashboard.tsx`)
- **KPIs**: Gradiente de fundo sutil por tipo (azul, verde, amber, roxo), sparkline real
- **Chart**: Adicionar cursor crosshair no hover, grid lines mais sutis
- **Ranking**: Adicionar avatar/logo do parceiro, medalha de posição (ouro/prata/bronze)
- **Alerts**: Animação pulse no dot do alerta crítico
- **Heatmap**: Tooltip com data e valor ao hover, bordas arredondadas nos cells
- **Tasks**: Adicionar progress bar visual, ações inline (checkbox)
- **Activity Feed**: Ícone com cor contextual, linha de timeline vertical conectando eventos
- **Greeting**: Adicionar emoji contextual animado, frase motivacional rotativa

### 5. Micro-interações CSS (`src/index.css`)
- Adicionar `@keyframes slide-up` para cards entrarem com animação
- Classe `.animate-slide-up` com delay escalonado
- Hover state nos KPIs com borda primary brilhante
- Tooltip glass effect mais refinado
- Scrollbar custom estilizada (thin, dark)

### 6. Responsividade Mobile
- KPIs em stack de 1 coluna no mobile com swipe horizontal
- Chart com altura reduzida no mobile
- Activity feed como lista compacta
- FAB menor e mais discreto

### Arquivos a editar
- `src/index.css` — novas animações e classes utilitárias
- `src/components/AppLayout.tsx` — dropdown avatar, breadcrumb, Cmd+K hint
- `src/components/consoles/BrandSidebar.tsx` — separadores gradiente, scroll indicator
- `src/pages/Dashboard.tsx` — sparklines nos KPIs, ranking com medalhas, timeline visual, animações de entrada

### Restrição
Apenas camada de apresentação. Nenhuma lógica de negócio alterada.

