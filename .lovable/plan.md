

# Sub-fase 6.3 — Fechamento (3 pontas soltas)

## ✅ Status atual da implementação

| Item | Status |
|---|---|
| Migração de banco (6 colunas em `subscription_plans`) | ✅ aplicada |
| CRUD `/admin/produtos-comerciais` + wizard 5 passos | ✅ funcional |
| Landing pública `/p/produto/:slug` | ✅ rota registrada |
| Catálogo público `/produtos` | ✅ rota registrada |
| `TrialSignupPage` lê `?plan=` e envia `plan_slug` | ✅ |
| Edge `provision-trial` aplica template do plano correto | ✅ |
| Manual em `dados_manuais.ts` | ✅ adicionado |
| Item "Produtos Comerciais" no sidebar | ✅ adicionado |

`npx tsc` limpo, banco coerente.

## ⚠️ 3 pontas soltas que ficaram

### 1. Plano `free` sumiu do banco
A migração rodou backfill, mas o registro `free` (que era o default do `provision-trial`) **não está mais lá** — só sobraram `starter`, `profissional`, `enterprise`. Resultado: qualquer trial **sem `?plan=`** vai cair no fallback `"free"` e o edge não vai achar template nenhum (a marca é criada, mas sem modelos/módulos pré-configurados).

**Correção:** decidir entre:
- (a) recriar o registro `free` como produto inicial padrão (mais seguro, retrocompat 100%)
- (b) trocar o default do edge para `"starter"` (e remover qualquer trial genérico sem `?plan=`)

### 2. Menu duplicado no sidebar Raiz
Hoje o sidebar mostra **dois itens** lado a lado:
- "Preços dos Planos" → `/plan-pricing` (página antiga `SubscriptionPlansAdminPage` — edita só os 3 planos, sem wizard, sem landing)
- "Produtos Comerciais" → `/admin/produtos-comerciais` (página nova)

Isso confunde — você acaba editando preço em 2 lugares. **Ação:** remover o item "Preços dos Planos" do sidebar e a rota `/plan-pricing` (mantém o arquivo `SubscriptionPlansAdminPage.tsx` por enquanto como fallback morto, removível depois).

### 3. Catálogo público `/produtos` não tem entrada
A rota existe mas ninguém linka pra ela. Dois caminhos:
- Adicionar link "Ver todos os produtos" no rodapé de `/p/produto/:slug`
- Adicionar botão "Catálogo de produtos" na home pública (`/`)

Sugiro o **primeiro** (mais discreto, não polui home).

## Arquivos a editar (4)

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/<nova>.sql` | INSERT do plano `free` (price_cents=0, slug='free', product_name='Free Trial', trial_days=30, is_public_listed=false) + popular `plan_business_models` e `plan_module_templates` mínimos para ele |
| `src/compartilhados/constants/constantes_menu_sidebar.ts` | remover item `sidebar.plan_pricing` (linha 333) |
| `src/App.tsx` | remover rota `/plan-pricing` (linha 292) e import do `SubscriptionPlansAdminPage` (linha 109) |
| `src/features/landing_produto/pagina_landing_produto.tsx` | adicionar link `/produtos` no rodapé ("Ver outros produtos") |

## O que NÃO entra agora (próximas sub-fases)
- Stripe Checkout automático após trial — fica na 6.4
- Edição visual rica da landing (depoimentos, FAQ, screenshots) — fica na 6.5
- Métricas de conversão por produto (visitas → trials → pagantes) — fica na 6.6

## Estimativa
~8 min. Commit atômico único. `npx tsc --noEmit` esperado limpo.

