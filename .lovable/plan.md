

# Sub-fase 6.3 — Produtos de Prateleira (Bundles vendáveis com Landing Page)

## Conceito

Hoje os planos (Free/Starter/Profissional/Enterprise) são **fixos no banco** e o trial sempre cria a marca no `free`. Você quer transformar o painel Raiz numa **fábrica de produtos comercializáveis**, onde para cada "produto" você define:

1. Nome comercial (produto) + nome do plano interno
2. Preço mensal/anual
3. Quais **modelos de negócio** vêm liberados
4. Quais **funcionalidades obrigatórias** (apenas as que esses modelos precisam)
5. Slug público para gerar uma **landing page com link de trial 30 dias** vinculado àquele produto

Resultado: você monta "Produto Motorista Premium", "Produto Cidade Pequena", "Produto Cliente + Achadinhos", etc. Cada um vira um link tipo `app.valeresgate.com.br/p/motorista-premium` com a landing já personalizada e CTA de trial que provisiona a marca exatamente naquele bundle.

## O que já existe e vai ser reaproveitado

| Peça | Estado |
|---|---|
| `subscription_plans` | tem `plan_key`, `label`, `price_cents`, `features[]`, `excluded_features[]` |
| `plan_business_models` | já liga modelo ↔ plano |
| `plan_module_templates` | já liga módulo ↔ plano (com `is_enabled`) |
| `business_model_modules` | já lista módulos obrigatórios de cada modelo |
| `provision-trial` (edge) | cria marca lendo template do plano `"free"` (hardcoded) |
| `/trial` | landing single-template do trial |
| `SubscriptionPlansAdminPage` | edita 4 planos fixos (não tem botão "criar novo") |

**Não precisa criar tabela nova** — vamos estender as 2 existentes (`subscription_plans` + `plan_module_templates`) e dar um CRUD completo no Raiz.

## O que vai ser construído

### 1. Banco — 4 colunas novas + 1 ajuste de RLS

**`subscription_plans` ganha:**

| Coluna | Tipo | Função |
|---|---|---|
| `product_name` | text | Nome comercial ("Vale Resgate Motorista Premium") — diferente do `label` interno |
| `slug` | text UNIQUE | Slug da landing pública (`motorista-premium`) |
| `price_yearly_cents` | integer NULL | Preço anual (mensal × 12 com desconto) |
| `landing_config_json` | jsonb | Config visual da landing: hero, descrição, screenshots, depoimentos, CTA color |
| `is_public_listed` | boolean default false | Se `true`, aparece em `/produtos` (catálogo público) |
| `trial_days` | integer default 30 | Dias de trial customizáveis por produto |

**Ajuste:** RLS já permite `SELECT` público; manter. INSERT/UPDATE/DELETE só `root_admin` (já existe).

### 2. Página Raiz — `/admin/produtos-comerciais` (substitui `SubscriptionPlansAdminPage`)

Refatorada num **CRUD completo** com lista + botão "Criar novo produto". Cada produto abre um wizard em 5 passos:

```text
┌─ Passo 1: Identificação ──────────────────┐
│  • Nome comercial (produto)               │
│  • Nome do plano (interno)                │
│  • Slug da landing                        │
│  • Preço mensal / anual                   │
│  • Trial em dias                          │
└───────────────────────────────────────────┘

┌─ Passo 2: Modelos de Negócio ─────────────┐
│  Lista os 13 modelos com checkbox.        │
│  Marca quais este produto inclui.         │
│  → grava em plan_business_models          │
└───────────────────────────────────────────┘

┌─ Passo 3: Funcionalidades ────────────────┐
│  Mostra só os módulos OBRIGATÓRIOS dos    │
│  modelos selecionados (via               │
│  business_model_modules) — pré-marcados.  │
│  Empreendedor pode adicionar opcionais.   │
│  → grava em plan_module_templates         │
└───────────────────────────────────────────┘

┌─ Passo 4: Landing Page ───────────────────┐
│  • Headline                                │
│  • Subheadline                             │
│  • Lista de benefícios (features visuais)  │
│  • Cor primária                            │
│  • Imagem hero (upload)                    │
│  • is_popular / is_public_listed           │
└───────────────────────────────────────────┘

┌─ Passo 5: Revisão + Link ─────────────────┐
│  Mostra preview da landing.               │
│  Gera link: /p/produto/{slug}             │
│  Botão "Copiar link de trial"             │
└───────────────────────────────────────────┘
```

### 3. Landing pública dinâmica — `/p/produto/:slug`

Nova rota pública (sem auth). Lê `subscription_plans` por slug:
- Renderiza hero, benefícios, preço, lista de funcionalidades
- Botão **"Começar trial 30 dias grátis"** → leva para `/trial?plan={slug}`

### 4. `/trial` aceita parâmetro `?plan=`

Hoje o trial é genérico. Ajuste:
- Lê `?plan=` da URL → busca `subscription_plans` pelo slug
- Mostra topo: "Você está iniciando o **{product_name}** — {trial_days} dias grátis"
- Passa `plan_slug` ao chamar `provision-trial`

### 5. Edge `provision-trial` — usa o plano escolhido

Mudança no `provision-trial/index.ts` (linha 362):
- Recebe `plan_slug` no body (default = `"free"` para retrocompat)
- Resolve `plan_key` por slug
- Aplica template daquele plano (não mais hardcoded `"free"`)
- Seta `brands.subscription_plan = plan_key` e `brand_business_models` conforme `plan_business_models`

### 6. Catálogo público opcional — `/produtos`

Página pública lista todos os produtos com `is_public_listed = true`. Cards lado a lado com botão "Ver mais" → `/p/produto/:slug`. Útil pra ter uma vitrine única se você quiser.

## Fluxo de uso (do seu lado)

1. Você acessa `/admin/produtos-comerciais` → "Criar produto"
2. Monta "Vale Resgate Motorista Premium" — escolhe os 6 modelos motorista, marca módulos
3. Configura landing (cores, headline)
4. Sistema gera link `app.valeresgate.com.br/p/produto/motorista-premium`
5. Você divulga esse link
6. Empreendedor clica → vê a landing daquele produto → clica "Trial 30 dias" → `provision-trial` cria a marca já no plano `motorista-premium` com modelos e módulos certos
7. Após trial, marca segue paga (cobrança manual via "Renovar Assinatura" — sub-fase futura conecta Stripe)

## Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<nova>.sql` | adicionar 6 colunas em `subscription_plans` + backfill `product_name = label` e `slug = plan_key` nos 4 atuais |
| `src/features/produtos_comerciais/pagina_produtos_comerciais.tsx` | **novo** — substitui `SubscriptionPlansAdminPage` (lista + botão criar) |
| `src/features/produtos_comerciais/components/wizard_produto.tsx` | **novo** — 5 passos |
| `src/features/produtos_comerciais/components/passo_*.tsx` | **5 novos** — um por passo |
| `src/features/produtos_comerciais/components/preview_landing.tsx` | **novo** — preview do passo 5 |
| `src/features/produtos_comerciais/hooks/hook_produtos_comerciais.ts` | **novo** — CRUD + sync `plan_business_models` + `plan_module_templates` |
| `src/features/produtos_comerciais/types/tipos_produto.ts` | **novo** |
| `src/features/landing_produto/pagina_landing_produto.tsx` | **novo** — `/p/produto/:slug` |
| `src/features/catalogo_produtos/pagina_catalogo_produtos.tsx` | **novo** — `/produtos` |
| `src/pages/TrialSignupPage.tsx` | ler `?plan=` + exibir produto + enviar `plan_slug` ao edge |
| `supabase/functions/provision-trial/index.ts` | aceitar `plan_slug`, aplicar template do plano correto, popular `plan_business_models` |
| `src/App.tsx` | adicionar rotas `/p/produto/:slug` e `/produtos` (públicas) |
| `src/components/manuais/dados_manuais.ts` | manual "Produtos Comerciais — Montar Bundle Vendável" |

## Riscos e rollback

- **Compatibilidade:** os 4 planos atuais continuam funcionando — backfill preenche `product_name` e `slug` automaticamente. `provision-trial` mantém default `"free"` se `plan_slug` não vier.
- **Sem quebra:** novas colunas todas com default ou nullable.
- **Rollback:** drop das 6 colunas + reverter rotas + restaurar `SubscriptionPlansAdminPage` antiga (fica salva no histórico do Lovable).

## Estimativa
~40 min (sub-fase maior por causa da landing dinâmica + wizard). Commit atômico único. `npx tsc --noEmit` esperado limpo.

## Confirmações antes de implementar

1. **Cobrança automática (Stripe)** desta vez **fica fora** do escopo? (você cria o produto, gera o link, mas a cobrança após trial continua manual via "Renovar Assinatura"