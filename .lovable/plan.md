

## Plano: Redesign Futurista do Painel Admin do Empreendedor

### Escopo
Redesign visual da camada de apresentação do painel administrativo (brand console), mantendo toda a lógica de negócio, rotas e dados intactos. Foco em estética moderna/futurista com glassmorphism, gradientes sutis, animações e hierarquia visual aprimorada.

### Alterações

#### 1. Header do AppLayout (`src/components/AppLayout.tsx`)
- Substituir `bg-card border-b` por header com glass effect (`backdrop-blur`, gradiente sutil)
- Logo com glow ring animado
- Badge de contexto com dot pulsante
- Separador visual com linha gradiente ao invés de border sólida

#### 2. Sidebar da Marca (`src/components/consoles/BrandSidebar.tsx`)
- Header com gradiente escuro e logo com anel de glow
- Grupos colapsáveis com indicador lateral colorido (barra vertical accent)
- Item ativo com background gradiente + borda lateral primary
- Badges com glow sutil (box-shadow)
- Footer com avatar estilizado e email truncado

#### 3. Dashboard (`src/pages/Dashboard.tsx`)
- **StatCards**: Redesign com ícone em container gradiente circular, valor com peso tipográfico maior, subtitle badge
- **Greeting section**: Saudação contextual (Bom dia/Boa tarde) com data formatada
- **Cards**: Border sutil com gradient top-line (2px colorido no topo)
- **Charts**: Background com grid sutil, tooltips com glass effect
- **CRM Card**: Gradiente mais dramático com glow
- **Quick Links**: Cards com hover scale + shadow transition

#### 4. CSS Tokens (`src/index.css`)
- Adicionar keyframes: `glow-pulse`, `float`, `gradient-shift`
- Novas classes utilitárias: `glass-card`, `gradient-border-top`, `stat-icon-container`, `futuristic-header`
- Refinar sombras e bordas com variáveis de glow

#### 5. UsersPage Brand View (`src/pages/UsersPage.tsx`)
- Cards de membros com avatar placeholder circular com iniciais
- Badge de role com gradiente por tipo
- Permissões count como ring/progress indicator
- Dialog de convite com steps visuais mais limpos

### Estilo Visual Alvo

```text
┌─────────────────────────────────────────────────┐
│ ░░ HEADER GLASS ░░  Logo ● Marca — Console  [⚙]│
│─── gradient line ───────────────────────────────│
│ SIDEBAR │  Bom dia, Empreendedor 👋            │
│ ┌─────┐ │  17 de março, 2026                    │
│ │ Logo│ │                                       │
│ │glow │ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ └─────┘ │  │◉ 245 │ │◉  18 │ │◉  32 │ │◉ 890 │ │
│ ▎Guias  │  │Client│ │Ofer. │ │Resg. │ │Pontos│ │
│  ›Guide │  └──────┘ └──────┘ └──────┘ └──────┘ │
│ ▎Gestão │                                       │
│  ›Ofer. │  ┌─ Chart ─────┐ ┌─ Chart ─────┐     │
│  ›Resg. │  │  ▁▃▅▇█▅▃▁  │ │  ▁▂▄▆█▆▃▁  │     │
│  ›Parc. │  └─────────────┘ └─────────────┘     │
│ ▎Config │                                       │
└─────────────────────────────────────────────────┘
```

### Princípios
- **Glassmorphism**: blur + transparências em header/tooltips
- **Gradient accents**: linhas de 2px gradient no topo de cards
- **Glow effects**: box-shadow com primary em elementos ativos
- **Smooth transitions**: hover com scale + shadow
- **Hierarquia tipográfica**: valores em 3xl bold, labels em xs muted

### Arquivos
- **Editar**: `src/index.css` (novos tokens CSS e keyframes)
- **Editar**: `src/components/AppLayout.tsx` (header glass)
- **Editar**: `src/components/consoles/BrandSidebar.tsx` (sidebar visual upgrade)
- **Editar**: `src/pages/Dashboard.tsx` (stat cards, greeting, layout refinements)
- **Editar**: `src/pages/UsersPage.tsx` (cards de membros com avatares e badges)
- **Editar**: `src/components/ContextBadge.tsx` (dot pulsante, micro refinements)

### Restrição
Apenas camada de apresentação. Nenhuma rota, query, mutation, autenticação ou estrutura de dados será alterada.

