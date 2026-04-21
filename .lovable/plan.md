

# Refinar Landing Page do Produto "Duelo" — padrão SaaS B2B premium

## Estado atual (auditoria)

A landing page atual em `src/features/landing_produto/` já tem a estrutura correta, mas peca em **densidade visual, copy genérica e posicionamento B2B fraco**. Diagnóstico por bloco:

| Bloco | Problema |
|---|---|
| **Hero** | Headline genérica vinda do banco (sem força comercial), CTA fala "Trial grátis" (consumer), sem mockup real do produto, "5 estrelas / 15 cidades" parece marketing barato |
| **Métricas** | Cards chapados, números sem contexto comercial |
| **Dores/Soluções** | Genérico ("Sem Duelo"/"Com Duelo"), sem dados de mercado |
| **Funcionalidades** | Grid simples de cards iguais — não conta a história do produto |
| **Preview** | 1-2 imagens estáticas sem narrativa de "como funciona em 3 passos" |
| **Pricing** | Foco em "trial grátis sem cartão" — linguagem B2C, não B2B |
| **Depoimentos** | Layout OK, mas depende 100% do banco |
| **CTA Final** | "Pronto para começar?" — fraco. Sem opção "Falar com especialista" |
| **Faltando** | Seção de "Como funciona em 3 passos", bloco de "Para quem é", logos de empresas, bloco ROI/diferenciação |

Como toda a copy e dados (headline, métricas, dores, soluções, benefícios, FAQ, depoimentos) vêm de `landing_config_json` na tabela `commercial_products`, **vou atuar em duas frentes**:

## Frente 1 — Refino dos componentes (visual + UX premium)

### 1.1 `bloco_hero.tsx` — reposicionar como SaaS B2B
- Eyebrow padrão: "Plataforma SaaS · Mobilidade Urbana"
- Headline com 2 linhas (suporte a quebra forte) e tipografia maior em desktop (até `text-7xl`)
- **Dois CTAs lado a lado**: principal ("Agendar demonstração") + secundário ("Ver como funciona")
- Trust strip mais B2B: "LGPD" / "Setup em 7 dias" / "Suporte dedicado" / "API white-label"
- Mockup do hero com **sombra premium + gradiente lateral** (frame estilo Stripe/Linear)
- Substituir "5 estrelas / 15 cidades" por badge de "Já implementado em XX cidades · Setor de mobilidade"
- Adicionar **glow animado sutil** (CSS, sem libs) atrás do mockup
- Background com **grid pattern sutil** (estilo Linear/Vercel) + radial glow

### 1.2 `bloco_metricas_destaque.tsx` — KPIs com contexto
- Números maiores, destaque tipográfico
- Adicionar legenda explicativa pequena abaixo de cada métrica ("vs. baseline sem o módulo")
- Border-top colorida (estilo card de dashboard)

### 1.3 `bloco_dores_solucoes.tsx` — narrativa de mercado
- Adicionar headline forte: "O motorista escolhe app por hábito. Mantém pelo que sente."
- Cards com ícones temáticos (ex: TrendingDown / TrendingUp)
- Adicionar 1 frase de "transição": "É exatamente isso que o Duelo resolve."

### 1.4 **NOVO bloco** `bloco_como_funciona.tsx` — 3 passos
- Timeline horizontal (desktop) / vertical (mobile)
- Passos: **1. Motoristas se desafiam → 2. Cidade acompanha em tempo real → 3. Vencedor leva o cinturão e pontos**
- Cada passo com ícone + mockup pequeno

### 1.5 `bloco_funcionalidades_grid.tsx` — destacar 6 pilares do Duelo
- Cards com ícones específicos (Swords, Crown, Trophy, Users, Zap, BarChart3)
- 1 card destacado (col-span-2) para "Cinturão da Cidade" como diferencial
- Hover com gradiente + scale

### 1.6 `bloco_preview_app.tsx` — galeria com tabs
- Tabs: "Dashboard do Duelo" / "Ranking" / "Cinturão" / "Acompanhamento ao vivo"
- Frame de browser/device em volta da imagem (chrome falso premium)
- Lado esquerdo: bullets que mudam conforme tab ativa

### 1.7 **NOVO bloco** `bloco_para_quem.tsx` — segmentação B2B
- "Feito para plataformas de mobilidade urbana"
- 3 perfis: "Apps de mobilidade regional" / "Cooperativas de motoristas" / "Plataformas white-label"
- Cada um com ícone e 1 frase de valor

### 1.8 `bloco_pricing_destaque.tsx` — linguagem B2B
- Headline: "Investimento previsível. Implementação rápida."
- CTA principal muda para "Agendar demonstração comercial"
- CTA secundário: "Quero ver funcionando" (abre trial)
- Adicionar microcópia: "Implementação assistida · Onboarding em 7 dias · Suporte dedicado"

### 1.9 `bloco_cta_final.tsx` — duplo CTA comercial
- Headline: "Pronto para transformar engajamento em vantagem competitiva?"
- **Dois botões**: "Agendar demonstração" (primário branco) + "Falar com especialista" (outline branco)
- Microcopy: "Resposta em até 1 dia útil"

### 1.10 `bloco_topbar.tsx` — adicionar link "Demonstração"

## Frente 2 — Atualizar copy do produto Duelo no banco

Via migração SQL, atualizar `landing_config_json` do produto com `slug='duelo'` (ou similar) com copy premium B2B:

- **headline**: "Transforme seus motoristas em uma comunidade ativa. Todos os dias."
- **subheadline**: "Duelo é o módulo de gamificação que aumenta retenção, presença e engajamento da base de motoristas em plataformas de mobilidade urbana."
- **eyebrow**: "Módulo SaaS · Engajamento & Retenção"
- **metrics**: 4 KPIs com contexto ("+38% Retenção mensal", "3.2x Engajamento diário", "82% Adesão dos motoristas", "<7 dias Setup completo")
- **problems** (5): "Motoristas entram no app, fazem corridas e somem", "Sem motivo para abrir o app fora do turno", "Concorrência baseada só em preço e comissão", "Comunidade fria, sem identidade local", "Difícil mensurar engajamento real"
- **solutions** (5): "Motoristas competem todo dia em duelos curtos", "App vira hábito — mesmo fora do turno", "Diferenciação por experiência, não por preço", "Cinturão da cidade cria identidade local", "Painel com métricas reais de engajamento"
- **benefits** (6): Duelos 1v1 / Ranking ao vivo / Top 10 da cidade / Cinturão da cidade / Torcida e palpites / Premiação em pontos — cada um com `description` rica e `icon`
- **faq** (6): perguntas B2B reais ("Como integra com nosso app?", "Quanto tempo de implementação?", "Funciona com qualquer base de motoristas?", "Como é a precificação?", "Tem SLA de suporte?", "É white-label?")
- **testimonials**: 2-3 depoimentos focados em resultado ("aumentamos retenção em X%")
- **cta_label**: "Agendar demonstração"

## Arquivos a editar / criar

**Editar:**
1. `src/features/landing_produto/components/bloco_hero.tsx`
2. `src/features/landing_produto/components/bloco_metricas_destaque.tsx`
3. `src/features/landing_produto/components/bloco_dores_solucoes.tsx`
4. `src/features/landing_produto/components/bloco_funcionalidades_grid.tsx`
5. `src/features/landing_produto/components/bloco_preview_app.tsx`
6. `src/features/landing_produto/components/bloco_pricing_destaque.tsx`
7. `src/features/landing_produto/components/bloco_cta_final.tsx`
8. `src/features/landing_produto/components/bloco_topbar.tsx`
9. `src/features/landing_produto/pagina_landing_produto.tsx` (incluir novos blocos)

**Criar:**
10. `src/features/landing_produto/components/bloco_como_funciona.tsx`
11. `src/features/landing_produto/components/bloco_para_quem.tsx`

**Migração SQL:**
12. UPDATE em `commercial_products` onde `slug` corresponde ao Duelo, atualizando `landing_config_json` com a copy premium B2B

## Nova ordem das seções (lógica de venda)

```
1.  Hero (com mockup premium)
2.  Métricas/KPIs (prova rápida)
3.  Dores/Soluções (problema do mercado)
4.  Como Funciona em 3 passos (NOVO)
5.  Para Quem é (NOVO — segmentação B2B)
6.  Funcionalidades (6 pilares)
7.  Preview do App (com tabs)
8.  Depoimentos (prova social)
9.  Pricing (linguagem B2B)
10. FAQ (objeções)
11. CTA Final (duplo: demo + especialista)
12. Footer
```

## O que NÃO vou mexer

- ❌ Sistema de `commercial_products` ou hooks de carregamento
- ❌ Schema/RLS de `commercial_products`
- ❌ Estrutura genérica que serve para outros produtos (mudanças continuam parametrizadas via `landing_config_json`)
- ❌ Fluxo de trial/checkout
- ❌ AuthContext, BrandContext, performance recém estabilizados

## Resultado esperado

- Página com cara de SaaS B2B premium (Linear / Vercel / Stripe / Notion)
- Copy específica do Duelo, persuasiva e direcionada a decisores de plataformas de mobilidade
- Jornada de venda clara: dor → solução → como funciona → para quem → benefícios → prova → preço → CTA
- CTAs comerciais B2B ("Agendar demonstração", "Falar com especialista") em vez de só "Trial grátis"
- 2 novos blocos (Como Funciona, Para Quem) que contam a história do produto

## Risco

Baixo. Componentes são isolados e parametrizados — nenhum produto existente quebra. A migração só atualiza JSON do produto Duelo específico.

## Estimativa

~20 min.

