

## Plano: Integração CRM + Harmonização Landing + White-Label

### Contexto
O CRM Vale Resgate (https://valeresgatacrm.lovable.app/) é um produto complementar ao sistema de fidelidade. O objetivo é posicioná-lo como ferramenta estratégica integrada, unificando a comunicação na landing page, no painel admin e reforçando o modelo white-label.

---

### 1. Nova seção na Landing Page: "CRM Estratégico"
**Arquivo:** Criar `src/components/landing/LandingCRM.tsx`

Seção visual entre "Commercial Model" e "FAQ" com:
- Título: "CRM Inteligente: Descubra clientes perdidos e potenciais"
- 3 cards com benefícios do CRM: Diagnóstico do Negócio, Clientes Perdidos, Potenciais Clientes
- Mockup de celular simulando dashboard do CRM (CSS puro, como já feito no AppPreview)
- CTA: "Experimente o CRM — 30 dias grátis" com link externo para o CRM
- Badge: "Incluso no ecossistema Vale Resgate"

### 2. Nova seção na Landing Page: "White-Label / Marca Própria"
**Arquivo:** Criar `src/components/landing/LandingWhiteLabel.tsx`

Seção entre "Benefits" e "Testimonials" explicando o modelo white-label:
- Título: "Sua marca, seu app, seu domínio"
- Mockup mostrando 2-3 variações de marca (cores/logos diferentes) no mesmo app
- 3 pontos: App com sua marca, Domínio personalizado, Identidade visual completa
- Texto reforçando que o empreendedor tem marca própria sem parecer plataforma de terceiros

### 3. Atualizar Landing Page layout
**Arquivo:** Editar `src/pages/LandingPage.tsx`
- Adicionar link "CRM" e "Marca Própria" na navbar
- Inserir `LandingWhiteLabel` após Benefits
- Inserir `LandingCRM` após Commercial Model
- Ordem final: Hero → Pain Points → App Preview → Benefits → **White-Label** → Testimonials → How It Works → Commercial Model → **CRM** → FAQ → Next Step → Footer

### 4. Adicionar acesso ao CRM no painel do Empreendedor
**Arquivo:** Editar `src/components/consoles/BrandSidebar.tsx`
- Adicionar item "CRM Estratégico" no grupo "📈 Análises" com ícone `BarChart3` ou `TrendingUp`
- Link abre o CRM em nova aba (link externo para https://valeresgatacrm.lovable.app/)

### 5. Card de CRM no Dashboard
**Arquivo:** Editar `src/pages/Dashboard.tsx`
- Adicionar card "CRM Estratégico" na seção de quick links (BrandQuickLinks) com:
  - Descrição: "Diagnóstico do negócio, clientes perdidos e potenciais"
  - Botão "Abrir CRM" abrindo em nova aba
  - Badge "30 dias grátis"

### 6. Atualizar Hero e Next Step com mensagem unificada
**Arquivos:** Editar `LandingHero.tsx` e `LandingNextStep.tsx`
- Adicionar check "CRM Estratégico incluso" nos trust signals do Hero
- No Next Step, adicionar texto: "Fidelidade + CRM: tudo com sua marca"

### 7. Atualizar Footer
**Arquivo:** Editar `LandingFooter.tsx`
- Adicionar link "CRM Estratégico" no footer

---

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/landing/LandingCRM.tsx` | Criar |
| `src/components/landing/LandingWhiteLabel.tsx` | Criar |
| `src/pages/LandingPage.tsx` | Editar — nova ordem + navbar |
| `src/components/landing/LandingHero.tsx` | Editar — trust signal CRM |
| `src/components/landing/LandingNextStep.tsx` | Editar — mensagem unificada |
| `src/components/landing/LandingFooter.tsx` | Editar — link CRM |
| `src/components/consoles/BrandSidebar.tsx` | Editar — item CRM |
| `src/pages/Dashboard.tsx` | Editar — card CRM |

