

# Sub-fase 6.5 — Landing Rica + Cobrança Mensal/Anual

## Objetivo
Antes de conectar Stripe (6.4 fica para depois), aumentar a **persuasão da landing pública** (`/p/produto/:slug`) com blocos visuais ricos (FAQ, depoimentos, screenshots, comparação) e introduzir **escolha mensal/anual** como toggle visual — preparando o terreno para o checkout futuro.

## O que vai ser construído

### 1. Banco — extensão do `landing_config_json`

Sem migração nova. O `landing_config_json` já é JSONB livre. Vamos passar a aceitar 4 campos novos opcionais:

```json
{
  "headline": "...",
  "subheadline": "...",
  "primary_color": "#...",
  "hero_image_url": "...",
  "benefits": ["..."],
  "cta_label": "...",

  // NOVOS
  "screenshots": [{ "url": "...", "caption": "..." }],
  "testimonials": [{ "name": "...", "role": "...", "quote": "...", "avatar_url": "..." }],
  "faq": [{ "question": "...", "answer": "..." }],
  "comparison_highlights": ["..."]
}
```

Garantia retrocompat: produtos sem esses campos renderizam landing igual à de hoje.

### 2. Wizard Passo 4 — abas internas

`passo_landing.tsx` ganha 4 abas internas (Tabs do shadcn):

| Aba | Conteúdo |
|---|---|
| **Visual** | headline, subheadline, cor, hero (já existe) |
| **Benefícios** | lista editável (já existe, só realocar) |
| **Provas sociais** | depoimentos (até 6) com nome/cargo/quote/avatar + screenshots (até 6) com legenda |
| **FAQ** | até 8 pares pergunta/resposta editáveis |

Cada aba salva no mesmo `landing_config_json`. Validação branda — todos os campos opcionais.

### 3. Toggle Mensal/Anual no wizard

Passo 1 (Identificação) hoje tem só `price_cents` e `price_yearly_cents`. Vamos:
- Renomear seção para **"Preços"**
- Mostrar os 2 campos lado a lado com cálculo automático de **% de desconto anual** (apenas exibição: ex: "16% de desconto vs mensal")
- Avisar se `price_yearly_cents` ficar > 12 × `price_cents` (alerta amarelo)

### 4. Landing — toggle mensal/anual + blocos novos

`pagina_landing_produto.tsx` reorganizada em seções:

```text
Hero (atual)
  └── novo: ícones de prova social abaixo (★ 4.9, X marcas usando)

[NOVA] Toggle "Mensal | Anual" no card de preço
  └── card de preço atualiza valor e mostra "Economize R$ X" se anual
  └── se price_yearly_cents for null, esconde o toggle (compat)

Benefícios (atual, mantido)

[NOVA] Screenshots (carrossel)
  └── grid 3 col desktop / scroll horizontal mobile

[NOVA] Depoimentos (cards)
  └── grid 2 col desktop com avatar + quote + nome/cargo

[NOVA] FAQ (accordion)
  └── shadcn Accordion, todos fechados por padrão

CTA bottom (atual)
Footer (atual)
```

Tudo opcional: bloco só renderiza se houver dados no `landing_config_json`.

### 5. TrialSignupPage — passa o ciclo escolhido

`?plan=motorista-premium&cycle=yearly` vira novo parâmetro. Banner topo da `/trial` mostra:
- "Você está iniciando **{produto}** — {trial_days} dias grátis"
- "Após o trial: R$ X/mês" ou "R$ Y/ano (economize R$ Z)"

Por enquanto o `cycle` é só **informativo** (vai para `metadata` na criação da brand). O Stripe efetivo entra na 6.4. Não há cobrança real ainda — só registro do ciclo escolhido.

### 6. Catálogo `/produtos` — preview do toggle

Cada card no catálogo ganha mini-toggle mensal/anual. Mostra a economia anual quando aplicável. Botão "Ver detalhes" leva para `/p/produto/:slug?cycle=...`.

### 7. Manual atualizado

Atualizar entrada `produtos-comerciais-bundle` em `dados_manuais.ts`:
- documentar as 4 abas do passo 4
- explicar campos novos do `landing_config_json`
- avisar que cobrança real ainda é manual (Stripe = 6.4)

## Arquivos a editar/criar

| Arquivo | Ação |
|---|---|
| `src/features/produtos_comerciais/types/tipos_produto.ts` | adicionar `screenshots`, `testimonials`, `faq`, `comparison_highlights` em `LandingConfig` |
| `src/features/produtos_comerciais/components/passo_landing.tsx` | refatorar para 4 abas internas |
| `src/features/produtos_comerciais/components/passo_landing_visual.tsx` | **novo** — aba Visual |
| `src/features/produtos_comerciais/components/passo_landing_provas.tsx` | **novo** — aba Provas (depoimentos + screenshots) |
| `src/features/produtos_comerciais/components/passo_landing_faq.tsx` | **novo** — aba FAQ |
| `src/features/produtos_comerciais/components/passo_identificacao.tsx` | adicionar cálculo de desconto anual |
| `src/features/landing_produto/pagina_landing_produto.tsx` | adicionar toggle ciclo + 3 blocos novos (screenshots, depoimentos, FAQ) |
| `src/features/landing_produto/components/bloco_screenshots.tsx` | **novo** |
| `src/features/landing_produto/components/bloco_depoimentos.tsx` | **novo** |
| `src/features/landing_produto/components/bloco_faq.tsx` | **novo** |
| `src/features/landing_produto/components/toggle_ciclo.tsx` | **novo** — mensal/anual reutilizável |
| `src/features/catalogo_produtos/pagina_catalogo_produtos.tsx` | mini-toggle nos cards |
| `src/pages/TrialSignupPage.tsx` | ler `?cycle=`, exibir preço pós-trial |
| `src/components/manuais/dados_manuais.ts` | atualizar manual existente do produto |

## Detalhes técnicos

- **Acessibilidade**: Accordion FAQ com `aria-expanded`, toggle ciclo com `role="radiogroup"`.
- **Mobile-first**: Screenshots viram scroll horizontal; depoimentos empilham; FAQ ocupa 100% largura.
- **Dark mode**: tudo respeita tokens existentes (`--card`, `--foreground`, etc). Nenhum estilo paralelo.
- **Realtime**: nenhum (landing pública lê uma vez via React Query).
- **Tipagem forte**: `LandingConfig` 100% tipado, sem `any`.
- **Compat**: Produtos antigos sem screenshots/depoimentos/FAQ renderizam exatamente igual.

## O que NÃO entra agora
- **Stripe Checkout real** → fica na 6.4 (próxima). O toggle anual hoje só registra metadata.
- **Métricas de conversão por produto** → fica na 6.6.
- **Editor visual drag-and-drop da landing** → fica para uma fase futura (form-based é suficiente).
- **A/B test entre versões da landing** → fora de escopo.

## Riscos e rollback
- **Sem migração**, sem alteração de RLS — risco baixo.
- **Rollback**: reverter os 13 arquivos. Banco intacto.
- **Compat**: 100%. Produtos atuais (4 no banco) ficam idênticos visualmente até alguém preencher os novos campos.

## Estimativa
~35 min. Commit atômico único. `npx tsc --noEmit` esperado limpo.

