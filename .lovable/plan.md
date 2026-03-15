

## Plano: Aplicar Design System Vale Resgate em toda a plataforma

Substituir os tokens de cor, tipografia e estilo atuais pelos definidos no Design System PDF, afetando toda a plataforma de forma global via CSS custom properties.

### Mudanças Principais

**1. Paleta de cores (`src/index.css`)**

| Token atual | Valor atual (HSL) | Novo valor (baseado no PDF) | Origem |
|---|---|---|---|
| `--primary` | `217 90% 50%` (azul) | `187 90% 53%` (Cyan #22D3EE) | Cor primaria PDF |
| `--ring` | `217 90% 50%` | `187 90% 53%` | Segue primary |
| `--accent` | `217 90% 95%` | `187 90% 92%` | Cyan claro |
| `--accent-foreground` | `217 90% 35%` | `187 90% 35%` | Cyan escuro |
| `--success` | `142 72% 40%` | `160 84% 39%` (#10B981) | Status verde PDF |
| `--destructive` | `0 72% 51%` | `0 84% 60%` (#EF4444) | Status vermelho PDF |
| `--warning` | `38 92% 50%` | `25 95% 53%` (#F97316) | Status laranja PDF |
| `--sidebar-primary` | `46 95% 55%` (gold) | `187 90% 53%` (Cyan) | Sidebar CTA |
| `--vb-gold` | gold | `45 96% 56%` (#FBBF24 amarelo) | Cor secundaria PDF |

**Dark mode**: Ajustar os mesmos tokens para variantes escuras do Cyan.

**2. Tipografia** - Inter ja e usada, manter. Garantir pesos 400-800.

**3. Sombras e border-radius** - Ajustar `--radius` de `0.625rem` para `0.5rem` (8px, padrao PDF para botoes). Cards usam 12px (lg).

**4. Landing Page (`LandingPage.tsx` + componentes)**
- Trocar `emerald-*` por `cyan-*` em todos os componentes landing
- Backgrounds: `hsl(160,30%,6%)` → cor escura Slate `#111827` (Cinza 900 do PDF)
- CTAs: `bg-emerald-500` → `bg-cyan-400` com texto branco
- Badges: `emerald-500/10` → `cyan-400/10`

**5. Sidebar tokens**
- `--sidebar-background`: manter escuro, ajustar para slate
- `--sidebar-primary`: Cyan em vez de gold
- `--sidebar-accent`: tom de cyan escuro

**6. Utilitarios CSS**
- `.kpi-icon-*` gradientes: ajustar paleta para usar Cyan como cor dominante
- `.glow-primary`: sombra cyan `rgba(6, 182, 212, 0.3)` (do PDF)

### Arquivos a editar

| Arquivo | Escopo |
|---|---|
| `src/index.css` | Todos os CSS custom properties (light + dark) |
| `src/pages/LandingPage.tsx` | Trocar cores emerald por cyan |
| `src/components/landing/LandingHero.tsx` | Cores emerald → cyan |
| `src/components/landing/LandingBenefits.tsx` | Cores emerald → cyan |
| `src/components/landing/LandingAppPreview.tsx` | Cores |
| `src/components/landing/LandingHowItWorks.tsx` | Cores |
| `src/components/landing/LandingWhiteLabel.tsx` | Cores |
| `src/components/landing/LandingCommercialModel.tsx` | Cores |
| `src/components/landing/LandingCRM.tsx` | Cores |
| `src/components/landing/LandingTestimonials.tsx` | Cores |
| `src/components/landing/LandingFAQ.tsx` | Cores |
| `src/components/landing/LandingNextStep.tsx` | Cores |
| `src/components/landing/LandingFooter.tsx` | Cores |

### Regras
- Zero alteracao em logica de negocio, rotas, queries, banco
- Somente camada de apresentacao (CSS tokens, classes de cor)

