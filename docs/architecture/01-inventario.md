# Fase 1 — Inventário Geral (Loyalty + Redeem)

Catálogo completo dos artefatos do produto Fidelidade + Resgate.

> Cobertura: 24 tabelas, 20 telas admin, 7 telas customer, 5 edge functions,
> 13 RPCs, 12 hooks/services principais.

---

## 1.1 Páginas (Admin)

### Dashboard & Core

#### `/` — Dashboard.tsx
- **Objetivo**: Home admin com KPIs (clientes ativos, resgates do dia, pontos distribuídos), feeds em tempo real
- **Dependências**: `useBrand`, `useBrandGuard`, `useBrandModules`, Realtime channel `dashboard-realtime-${brandId}`
- **Entradas**: `brand_id` (do contexto)
- **Saídas**: render dashboard com gráficos (recharts)
- **APIs**: `customers`, `redemptions`, `points_ledger`, `branch_points_wallet` (SELECT agregados)

#### `/branch-wallet` — BranchWalletPage.tsx
- **Objetivo**: Saldo de pontos da branch (quantos pontos a branch já comprou e quantos distribuiu)
- **Entradas**: `branch_id`
- **Saídas**: cards de saldo + histórico de transações
- **APIs**: `branch_points_wallet`, `branch_wallet_transactions`

### Gestão de Tenants/Brands/Branches

#### `/tenants` — Tenants.tsx
- **Objetivo**: CRUD de tenants (root admin gerencia clientes do SaaS)
- **Permissão**: `root_admin`
- **APIs**: `tenants.select|insert|update|delete`

#### `/brands` + `/brand-branches` — Brands.tsx, BrandBranchesPage.tsx
- **Objetivo**: CRUD de marcas e suas cidades
- **Permissão**: `root_admin` (brands) / `brand_admin` (branches da própria marca)
- **APIs**: `brands.*`, `branches.*`

### Clientes

#### `/customers` — CustomersPage.tsx
- **Objetivo**: Lista + busca de clientes por brand. Permite editar tier, CPF, telefone
- **Permissão**: `wallet` module
- **Dependências**: `useBrandGuard`, `useDebouncedSearch`, `useCrmContacts` (sync)
- **APIs**: `customers.*`, `points_ledger` (SELECT pra exibir saldo)

### Pontos

#### `/earn-points` — EarnPointsPage.tsx
- **Objetivo**: PDV pro operador da loja registrar compra do cliente e creditar pontos
- **Permissão**: `earn_points_store` module
- **Fluxo**: busca cliente por CPF/telefone → digita valor da compra → confirma → cria `earning_event` + `points_ledger` entry
- **APIs**: `customers.search`, RPC `credit_customer_points`, edge function `earn-webhook` (alternativa via API)

#### `/points-rules` — PointsRulesPage.tsx
- **Objetivo**: Configurar regra de pontuação por branch (X pontos por real, mínimo de compra, máximo diário)
- **Tipos**: `PER_REAL`, `FIXED`, `TIERED` (definido em `points_rule_type` enum)
- **APIs**: `points_rules.*`

#### `/points-ledger` — PointsLedgerPage.tsx
- **Objetivo**: Auditoria de TODAS movimentações de pontos (debit/credit) com filtros
- **APIs**: `points_ledger.select` com filtros por customer/branch/date

#### `/store-points-rule` + `/tier-points-rules`
- **Objetivo**: Override de pontuação por loja específica / por tier de cliente
- **APIs**: `store_points_rules.*`, `tier_points_rules.*`

#### `/pdv` — OperatorRedeemPage.tsx
- **Objetivo**: PDV de **resgate** (cliente apresenta QR Code, loja confirma)
- **APIs**: `redemptions.select|update(status='USED')`

### Ofertas

#### `/offers` — OffersPage.tsx
- **Objetivo**: CRUD de ofertas com workflow DRAFT → PENDING → APPROVED → ACTIVE → EXPIRED
- **Permissão**: `offers` module
- **APIs**: `offers.*`, `stores.select`, `branches.select`

#### `/offer-governance` — OfferGovernancePage.tsx
- **Objetivo**: Fila de aprovação de ofertas (PENDING) pelo admin
- **APIs**: `offers.update(status)`

### Vouchers

#### `/vouchers` — Vouchers.tsx + VoucherForm.tsx + VoucherWizardPage.tsx
- **Objetivo**: CRUD de códigos promocionais (vouchers com %, valor fixo, uso limitado)
- **Permissão**: `vouchers` module
- **APIs**: `vouchers.*`, `voucher_redemptions` (audit)

#### `/vouchers/redeem` — VoucherRedeem.tsx
- **Objetivo**: Operador resgata voucher por código
- **APIs**: `vouchers.select.eq(code)`, `voucher_redemptions.insert`

### Resgates

#### `/redemptions` — RedemptionsPage.tsx
- **Objetivo**: Ledger de resgates (PENDING/USED/EXPIRED/CANCELED) com filtros
- **APIs**: `redemptions.select` + JOIN com `offers`, `customers`

#### `/product-redemption-orders` — ProductRedemptionOrdersPage.tsx
- **Objetivo**: Pedidos de resgate de produtos (affiliate deals) com fluxo de entrega
- **APIs**: `product_redemption_orders.*`, RPC `refund_customer_points` (cancelamento)

### Lojas

#### `/stores` — StoresPage.tsx
- **Objetivo**: CRUD lojas físicas/online com slug, categoria, endereço, whatsapp
- **Permissão**: `stores` module
- **APIs**: `stores.*`, `branches.select`

#### `/store-catalog` — StoreCatalogPage.tsx
- **Objetivo**: Catálogo de produtos da loja (multi-emitter)
- **APIs**: `store_products.*`

### Notificações

#### `/send-notification` — SendNotificationPage.tsx
- **Objetivo**: Disparar notificação push/in-app pra grupo de clientes
- **APIs**: `customer_notifications.insert`, edge function `send-push-notification`

---

## 1.2 Páginas (Customer — `/c/*`)

Renderizadas via `CustomerLayout.tsx` (singleton) que carrega tabs dinâmicas
baseado em `brand_modules` habilitados.

#### Home (`/c/`) — CustomerHomePage.tsx
- **Objetivo**: Banners promocionais, categorias, seções customizadas (page builder)
- **Hooks**: `useCustomer`, `useBrand`, `useBrandModules`
- **APIs**: `brands(section_config)`, `banners.select`, `brand_pages.select`

#### Ofertas (`/c/ofertas`) — CustomerOffersPage.tsx
- **Objetivo**: Browse ofertas ativas com filtros por loja/categoria
- **APIs**: `offers.select.eq(status='ACTIVE')`, `stores.select`, `customer_favorites.select`

#### Detalhe de Oferta — CustomerOfferDetailPage.tsx (overlay)
- **Objetivo**: Ver detalhes + iniciar resgate
- **APIs**: `offers.select.eq(id)`, `redemptions.insert` (cria PENDING)

#### Checkout Resgate — CustomerRedeemCheckout.tsx
- **Objetivo**: Confirmação final antes de gerar QR code de resgate
- **Fluxo**: cliente seleciona loja → confirma → OTP via SMS → gera QR
- **APIs**: edge function `send-otp-code`, `verify-otp-code`, `redemptions.update(token, status)`

#### Resgates (`/c/resgates`) — CustomerRedemptionsPage.tsx
- **Objetivo**: Histórico de resgates do cliente + QR codes ainda válidos
- **APIs**: `redemptions.select.eq(customer_id)`

#### Carteira (`/c/carteira`) — CustomerWalletPage.tsx
- **Objetivo**: Saldo de pontos + extrato (ledger)
- **APIs**: `customers.select(points_balance)`, `points_ledger.select.eq(customer_id)`

#### Perfil (`/c/perfil`) — CustomerProfilePage.tsx
- **Objetivo**: Editar CPF, telefone, email, foto
- **APIs**: `customers.update`

---

## 1.3 Auth & Public

| Rota | Arquivo | Objetivo |
|---|---|---|
| `/auth` | `Auth.tsx` | Login/signup admin (email + senha via Supabase Auth) |
| `/reset-password` | `ResetPassword.tsx` | Fluxo recuperação senha |
| `/customer-preview` | `CustomerPreviewPage.tsx` | Preview da UI customer (sem auth client) |
| `/p/:slug` | `CustomPage.tsx` | Landing customizada por brand (page builder) |
| `/landing` | `LandingPage.tsx` | Landing principal do SaaS |

---

## 1.4 Componentes principais

### Layouts
- **`AppLayout.tsx`** — sidebar + header pro admin
- **`CustomerLayout.tsx`** — tabs + bottom-nav pro storefront cliente
- **`ProtectedRoute.tsx`** — guard de auth (redirect /auth se logged out)
- **`ModuleGuard.tsx`** — guard de module habilitado (redirect / se módulo off)

### Componentes de domínio
- **`BranchSelector.tsx`** — dropdown de cidades dentro da brand
- **`OfferCard.tsx`** + variantes — render de oferta na lista
- **`StoreCard.tsx`** — render de loja com logo + categorias
- **`CustomerRedeemFlow/*`** — wizard de resgate (selecionar loja → OTP → QR)

### UI primitivos
- `src/components/ui/*` — shadcn/ui (button, card, dialog, etc) — ~50 componentes

---

## 1.5 Hooks & Services

| Hook | Arquivo | Objetivo |
|---|---|---|
| `useBrand` | `src/contexts/BrandContext.tsx` | Brand corrente + branches |
| `useBrandResolver` | `src/contexts/brand/` | só brand/loading (otimizado pós-F5.1) |
| `useBrandData` | `src/contexts/brand/` | só branches/selectedBranch |
| `useAuth` | `src/contexts/AuthContext.tsx` | user + roles |
| `useCustomer` | `src/contexts/CustomerContext.tsx` | customer logged in (storefront) |
| `useBrandGuard` | `src/hooks/useBrandGuard.ts` | resolve `currentBrandId`/`currentBranchId` com defesa |
| `useBrandModules` | `src/hooks/useBrandModules.ts` | módulos habilitados |
| `useBrandTheme` | `src/hooks/useBrandTheme.ts` | aplica CSS vars do brand_settings_json |
| `useDebouncedSearch` | `src/hooks/useDebouncedSearch.ts` | search input com debounce 300ms |

### Services (`src/modules/loyalty/services/`)

- **`earningService.ts`** — `creditPoints(customerId, value, source, ...)` — valida limits, cria event + ledger
- **`redemptionService.ts`** — `createRedemption(customerId, offerId)` — calcula token, gera QR data, retorna pending
- **`voucherService.ts`** — `redeemVoucher(code)` — valida expiração + use count, cria redemption

---

## 1.6 Edge Functions (Deno)

| Função | Path | Trigger | Objetivo |
|---|---|---|---|
| `earn-webhook` | `supabase/functions/earn-webhook/` | POST público com API key | Cria `earning_event` via webhook externo (PDV integrado) |
| `send-otp-code` | `supabase/functions/send-otp-code/` | Invoke do cliente | Gera OTP server-side, envia por email/SMS, salva hash SHA-256 |
| `verify-otp-code` | `supabase/functions/verify-otp-code/` | Invoke do cliente | Valida OTP, marca como `used` atomicamente |
| `send-push-notification` | `supabase/functions/send-push-notification/` | Invoke do admin | Web Push pra subscribers ativos |
| `notify-driver-points` | `supabase/functions/notify-driver-points/` | Trigger DB ou cron | Notifica motorista de pontos creditados (parcial loyalty) |

---

## 1.7 RPCs Postgres (chamadas do frontend)

### Core loyalty

| RPC | Assinatura | Objetivo |
|---|---|---|
| `credit_customer_points` | `(p_customer_id, p_brand_id, p_branch_id, p_points, p_money, p_source, p_reference_type, p_reference_id, p_created_by_user_id)` | Crédito atômico: cria `points_ledger` + atualiza `customers.points_balance` |
| `refund_customer_points` | `(p_customer_id, p_brand_id, p_branch_id, p_points, p_reason, p_reference_type, p_reference_id, p_created_by_user_id)` | Estorno (resgate cancelado/rejeitado) |
| `get_boot_context` | `(p_hostname, p_brand_id)` | RPC unificada de boot — resolve brand + roles + profile + branches em 1 round-trip |

### Helpers

| RPC | Objetivo |
|---|---|
| `branch_has_feature` / `brand_has_feature` | Check se feature flag está ativa pra brand/branch |
| `get_recommended_offers` | Sugestão de ofertas pro cliente baseado em histórico |
| `get_points_ranking` | Ranking de clientes por pontos acumulados (gamification) |
| `get_branch_points_ranking` | Ranking agregado por branch |
| `confirm_package_order` | Confirma compra de pacote de pontos (cria ledger entries pra crédito) |

---

## 1.8 Integrações externas

| Integração | Direção | Função | Quando dispara |
|---|---|---|---|
| **Resend (email)** | Saída | Envio de OTP por email | `send-otp-code` edge function |
| **Web Push API** | Saída | Notificação push pra browser | `send-push-notification` |
| **PDV externo (webhook)** | Entrada | Recebe `earning_event` via POST | `earn-webhook` endpoint |
| **Stripe** | Bidirecional | Cobrança de assinatura SaaS (tenant pagando) | `create-checkout`, `stripe-webhook` |
| **PWA Manifest** | Saída | Manifest dinâmico por brand (logo, cores, install) | `vite-plugin-pwa` + `useBrandTheme` |

---

## 1.9 Tabelas (24)

Resumo — DDL completo em [`03-modelagem-banco.md`](./03-modelagem-banco.md).

### Core tenant/brand/branch (3)
- `brands` — marcas
- `branches` — cidades por marca
- `profiles` — extensão de `auth.users` (admin)

### Cliente (4)
- `customers` — cliente final (com saldo materializado)
- `customer_favorites` — ofertas favoritadas
- `customer_favorite_stores` — lojas favoritadas
- `customer_notifications` — notificações in-app

### Pontuação (5)
- `points_rules` — regra por branch (taxa de pontos)
- `tier_points_rules` — regra por tier do cliente
- `store_points_rules` — override por loja
- `earning_events` — log de eventos de ganho
- `points_ledger` — ledger imutável (CREDIT/DEBIT)

### Resgate (3)
- `offers` — ofertas resgatáveis
- `redemptions` — resgates feitos (PENDING/USED/etc)
- `product_redemption_orders` — pedidos de resgate de produtos físicos

### Vouchers (2)
- `vouchers` — códigos promocionais
- `voucher_redemptions` — uso de vouchers

### Lojas (1)
- `stores` — lojas parceiras

### Wallet & Packages (3)
- `branch_points_wallet` — saldo da branch
- `branch_wallet_transactions` — log de transações da wallet
- `points_packages` — pacotes vendáveis
- `points_package_orders` — pedidos de compra de pacote

### Notificações (1)
- `push_subscriptions` — endpoints Web Push

### Segmentação (3)
- `taxonomy_categories` — categorias raiz
- `taxonomy_segments` — segmentos pra matching
- `segment_synonym_logs` — learning log (free text → segment)

### Campanhas e prêmios (2)
- `duel_prize_campaigns` — campanhas de prêmios resgatáveis (parcial campeonato/loyalty)
- `duel_cycle_reset_history` — auditoria de resets

---

## 1.10 Permissões (resumo)

Sistema de roles em `user_roles` (n:m de `auth.users` x `brand_id`):

| Role | Escopo | Pode fazer |
|---|---|---|
| `root_admin` | global | Tudo (CRUD tenants, brands, branches, customers, infra) |
| `tenant_admin` | tenant | CRUD brands do tenant |
| `brand_admin` | brand | CRUD branches/customers/offers/stores/vouchers da brand |
| `branch_admin` | branch | CRUD na branch (não cria branch) |
| `store_owner` | store | Gerencia só sua loja, painel self-service |
| (sem role) | público | Browse landing, ler ofertas públicas |

RLS policies validam via `has_role(auth.uid(), 'brand_admin', brand_id)`
helper definido em migration `20260228025904`.

Cliente (storefront) NÃO usa `auth.users` — usa CPF + localStorage via
`CustomerContext`. RLS valida `customer_id` matching o customer da request.

---

## 1.11 Gatilhos (Triggers DB)

Triggers críticas do loyalty:

| Trigger | Tabela | Quando | Objetivo |
|---|---|---|---|
| `update_customer_balance` | `points_ledger` | AFTER INSERT | Recalcula `customers.points_balance` |
| `validate_branch_integrity` | `redemptions`, `offers`, `earning_events` | BEFORE INSERT/UPDATE | Confere que `branch_id` pertence ao `brand_id` (defense-in-depth contra cross-tenant) |
| `audit_changes` | `customers`, `offers`, `vouchers` | AFTER UPDATE/DELETE | Insere em `audit_logs` |
| `set_redemption_expires_at` | `redemptions` | BEFORE INSERT | Calcula `expires_at = now() + interval (offer.redemption_validity_days)` |

Detalhes completos em [`04-regras-de-negocio.md`](./04-regras-de-negocio.md).

---

## 1.12 Funções utilitárias (frontend)

| Função | Arquivo | Objetivo |
|---|---|---|
| `dateRangeISO` | `src/lib/dateTz.ts` | Converte range de input HTML date pra ISO UTC respeitando TZ Brasil |
| `yearMonthInTz` | `src/lib/dateTz.ts` | YYYY-MM no fuso correto (fix do billing bug F1) |
| `cleanPrice` | (custom) | Parsing de preço BR ("R$ 49,90") pra número |
| `normalizeCPF` | `src/lib/cpf.ts` | Strip non-digit + valida 11 chars |
| `formatCPF` | `src/lib/cpf.ts` | "12345678900" → "123.456.789-00" |

---

> Próxima fase: [02-arquitetura.md](./02-arquitetura.md) — diagramas e fluxos.
