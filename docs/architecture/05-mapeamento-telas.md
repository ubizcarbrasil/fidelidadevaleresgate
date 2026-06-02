# Fase 5 — Mapeamento de Telas (Loyalty + Redeem)

Documentação por tela: objetivo, componentes, campos, eventos, APIs consumidas
e regras de validação. Foco nas telas do escopo Loyalty + Redeem (não inclui
campeonato, motorista, achadinho admin, CRM órfão).

---

## 5.1 ADMIN — Dashboard

### `/` — `Dashboard.tsx`

- **Objetivo**: Visão geral de KPIs do dia + feeds em tempo real
- **Componentes**:
  - `<KpiCards>` — 4 cards (clientes ativos, resgates do dia, pontos distribuídos, saldo wallet)
  - `<PointsFeed>` — feed em tempo real de earning_events (Realtime channel)
  - `<RankingPontuacao>` — top 10 clientes da semana
  - `<RealtimeRefreshGate>` — subscribe `dashboard-realtime-${brandId}` em redemptions/machine_rides/customers/offers
- **Campos**: nenhum input direto; só leitura
- **Botões**: branch selector (dropdown), refresh manual
- **Eventos**:
  - Mount → subscribe Realtime
  - `INSERT redemption` → invalidate `redemptions` query
  - `INSERT earning_event` → invalidate `customers` query
- **APIs consumidas**:
  - `customers.count` (filtro brand_id)
  - `redemptions.select(brand_id, status, created_at)`
  - `branch_points_wallet.select(branch_id)`
  - `points_ledger.aggregate sum(points_amount)`
- **Validações**: nenhuma (read-only)

---

## 5.2 ADMIN — Clientes

### `/customers` — `CustomersPage.tsx`

- **Objetivo**: Listar/buscar clientes da brand, editar dados, scoring manual
- **Componentes**:
  - `<DebouncedSearchInput>` — busca por nome/CPF/telefone
  - `<DataTable customers>` — colunas: nome, CPF, telefone, tier, saldo, last_activity
  - `<EditCustomerDialog>` — modal de edição
  - `<ManualScoringDialog>` — débito/crédito manual com motivo obrigatório
- **Campos** (edição):
  - `name` (text, required, 2-120 chars)
  - `cpf` (text, validação dígitos brasileiros)
  - `phone` (text, formato `(XX) 9XXXX-XXXX`)
  - `email` (email, opcional)
  - `customer_tier` (select: INICIANTE/BRONZE/PRATA/OURO/GALÁTICO)
  - `is_active` (toggle)
- **Botões**:
  - "Novo cliente" → cria customer
  - "Scoring manual" → débito/crédito ad-hoc (gera ledger entry MANUAL_ADJUSTMENT)
  - "Histórico" → drawer com `points_ledger.eq(customer_id)`
- **Eventos**: search (debounce 300ms), edit submit, manual scoring submit
- **APIs**:
  - `customers.select` (filtro brand_id + ilike name/cpf/phone)
  - `customers.update` (RLS valida brand_admin)
  - RPC `credit_customer_points` ou `refund_customer_points` (scoring manual)
  - `points_ledger.select.eq(customer_id)` (histórico)
- **Validações**:
  - CPF formato 11 dígitos
  - Phone formato BR
  - Email RFC 5322 (zod)

---

## 5.3 ADMIN — Pontos

### `/earn-points` — `EarnPointsPage.tsx`

- **Objetivo**: PDV pro operador da loja registrar compra do cliente
- **Componentes**:
  - `<CustomerSearchInput>` — busca por CPF/phone
  - `<PurchaseValueInput>` — currency input "R$ 0,00"
  - `<ReceiptCodeInput>` — opcional (obrigatório se `points_rules.require_receipt_code`)
  - `<PointsPreview>` — exibe pontos calculados em tempo real
  - `<ConfirmButton>` — submit
- **Campos**:
  - `cpf_or_phone` (busca)
  - `purchase_value` (numeric > 0)
  - `receipt_code` (text, opcional)
  - `store_id` (select, default = loja vinculada ao operador)
- **Botões**:
  - "Buscar cliente" → fetch customer
  - "Registrar compra" → submit
- **Eventos**:
  - Search → `customers.select.eq(cpf)`
  - Value change → calcula preview de pontos via `points_rules` + `tier_points_rules`
  - Submit → RPC `credit_customer_points`
- **APIs**: RPC `credit_customer_points`
- **Validações** (R1, R2, R3, R4):
  - `purchase_value >= min_purchase_to_earn`
  - daily limit por customer/store
  - receipt_code único na brand (se obrigatório)

### `/points-rules` — `PointsRulesPage.tsx`

- **Objetivo**: Configurar regra base de pontuação por brand/branch
- **Campos**:
  - `rule_type` (PER_REAL/FIXED/TIERED)
  - `points_per_real` (numeric > 0)
  - `min_purchase_to_earn` (numeric)
  - `max_points_per_purchase` (integer)
  - `max_points_per_customer_per_day` (integer)
  - `max_points_per_store_per_day` (integer)
  - `require_receipt_code` (boolean)
- **APIs**: `points_rules.insert|update`

### `/points-ledger` — `PointsLedgerPage.tsx`

- **Objetivo**: Auditoria de movimentações (read-only)
- **Componentes**: `<DataTable ledger>` com filtros (customer, date range, type)
- **APIs**: `points_ledger.select` + filtros com JOIN em `customers`
- **Validações**: nenhuma (read-only)

### `/pdv` — `OperatorRedeemPage.tsx`

- **Objetivo**: Valida QR code de resgate apresentado pelo cliente
- **Componentes**:
  - `<QrScanner>` — câmera lê QR
  - `<RedemptionPreview>` — exibe oferta + cliente + valor
  - `<ConfirmUseButton>` — marca como USED
- **Eventos**:
  - QR detectado → `redemptions.select.eq(token).eq(status,'PENDING')`
  - Confirma → `redemptions.update({ status: 'USED', used_at: now() })`
- **APIs**: `redemptions.select|update`
- **Validações**: token existe, status='PENDING', expires_at > now()

---

## 5.4 ADMIN — Ofertas

### `/offers` — `OffersPage.tsx`

- **Objetivo**: CRUD de ofertas com workflow DRAFT → PENDING → APPROVED → ACTIVE → EXPIRED
- **Componentes**:
  - `<OfferStatusFilter>` (chip filter)
  - `<DataTable offers>` colunas: título, loja, status, valor, criado_em
  - `<OfferForm>` modal de criação/edição
- **Campos** (form):
  - `title` (text, required, 3-100 chars)
  - `description` (textarea, opcional)
  - `image_url` (file upload → Supabase Storage)
  - `store_id` (select)
  - `value_rescue` (numeric, valor em pontos OU desconto)
  - `min_purchase` (numeric, opcional)
  - `start_at` / `end_at` (datetime-local)
  - `allowed_weekdays` (checkboxes 0-6)
  - `allowed_hours` (`HH:MM-HH:MM`)
  - `max_daily_redemptions` (integer, opcional)
  - `status` (initial=DRAFT)
- **Botões**:
  - "Publicar" → status PENDING
  - "Aprovar" (admin) → status APPROVED
  - "Ativar" → status ACTIVE
  - "Expirar" → status EXPIRED
- **APIs**: `offers.insert|update|delete`, `stores.select`
- **Validações**:
  - Trigger `validate_offer_branch` garante store pertence à brand/branch
  - `start_at < end_at` (client + server)
  - `allowed_weekdays` precisa ter pelo menos 1

### `/offer-governance` — `OfferGovernancePage.tsx`

- **Objetivo**: Fila de ofertas PENDING pra aprovação
- **APIs**: `offers.select.eq(status,'PENDING')`, `offers.update(status)`

---

## 5.5 ADMIN — Vouchers

### `/vouchers` — `Vouchers.tsx` + `VoucherWizardPage.tsx`

- **Objetivo**: CRUD códigos promocionais
- **Campos**:
  - `code` (text, único por branch — UNIQUE constraint)
  - `title` (text)
  - `description` (textarea)
  - `discount_percent` OU `discount_value` (mutuamente exclusivo)
  - `max_uses` (integer)
  - `expires_at` (datetime)
  - `campaign` (text, agrupador)
- **Eventos**: edit/delete
- **APIs**: `vouchers.insert|update|delete`, `voucher_redemptions.select` (audit)
- **Validações**:
  - `code` 6-20 chars, sem espaços
  - `discount_percent` OU `discount_value` (XOR)
  - `expires_at > now()`

### `/vouchers/redeem` — `VoucherRedeem.tsx`

- **Objetivo**: Operador resgata voucher por código
- **Campos**: `code` (text)
- **Eventos**: submit → `vouchers.select.eq(code)`, validar, `voucher_redemptions.insert`
- **APIs**: `vouchers.select|update`, `voucher_redemptions.insert`
- **Validações** (R31): status active, expires_at > now(), current_uses < max_uses

---

## 5.6 ADMIN — Lojas

### `/stores` — `StoresPage.tsx`

- **Objetivo**: CRUD lojas parceiras
- **Campos**:
  - `name` (text, required)
  - `slug` (text, único por branch — auto-gerado de name)
  - `logo_url` (upload)
  - `category` (select de taxonomy_categories)
  - `address` (text)
  - `whatsapp` (text, formato BR)
  - `is_active` (toggle)
- **APIs**: `stores.insert|update|delete`, `branches.select`

### `/store-catalog` — `StoreCatalogPage.tsx`

- **Objetivo**: Catálogo de produtos da loja (multi-emitter)
- **APIs**: `store_products.*` (tabela aux)

---

## 5.7 ADMIN — Resgates

### `/redemptions` — `RedemptionsPage.tsx`

- **Objetivo**: Ledger de resgates com filtros
- **Componentes**: `<StatusFilter>`, `<DateRangePicker>`, `<DataTable redemptions>`
- **APIs**: `redemptions.select` + JOIN com `offers`, `customers`, `stores`
- **Validações**: read-only (admin pode cancelar manualmente — gera refund via R16)

### `/product-redemption-orders` — `ProductRedemptionOrdersPage.tsx`

- **Objetivo**: Pedidos de produto físico (entrega)
- **Workflow**: PENDING → APPROVED → SHIPPED → DELIVERED (ou REJECTED com refund)
- **Campos** (admin):
  - `tracking_code` (text)
  - `status` (select)
  - `notes` (textarea)
- **APIs**: `product_redemption_orders.update`, RPC `refund_customer_points` (em REJECTED)

---

## 5.8 ADMIN — Wallet

### `/branch-wallet` — `BranchWalletPage.tsx`

- **Objetivo**: Saldo de pontos da branch (quanto comprou vs distribuiu)
- **Componentes**:
  - `<BalanceCard>` — `balance`, `total_loaded`, `total_distributed`
  - `<TransactionsList>` — feed de `branch_wallet_transactions`
- **APIs**: `branch_points_wallet.select`, `branch_wallet_transactions.select`

---

## 5.9 ADMIN — Notificações

### `/send-notification` — `SendNotificationPage.tsx`

- **Objetivo**: Disparar notificação push/in-app
- **Campos**:
  - `target` (select: TODOS / TIER / CUSTOMERS_SELECTED)
  - `title` (text, max 80)
  - `body` (textarea, max 200)
  - `cta_url` (text, opcional)
  - `schedule_at` (datetime, opcional)
- **Eventos**:
  - Submit → cria `customer_notifications.insert` em batch
  - Se `push_subscriptions` existe → invoke `send-push-notification`
- **APIs**: `customer_notifications.insert`, edge function `send-push-notification`
- **Validações**: target tem pelo menos 1 customer

---

## 5.10 CUSTOMER — Home

### `/c/` — `CustomerHomePage.tsx`

- **Objetivo**: Storefront: banners, categorias, seções (page builder)
- **Componentes**:
  - `<BannerCarousel>` — banners ativos
  - `<CategoryGrid>` — categorias de loja com ícone
  - `<HomeSectionsRenderer>` — seções configuráveis (Achadinhos, Ofertas, Stores)
  - `<BottomNav>` — tabs (Home, Ofertas, Resgates, Carteira, Perfil)
- **Hooks**: `useCustomer`, `useBrand`, `useBrandModules`
- **APIs**:
  - `brands.select(brand_settings_json)`
  - `banners.select.eq(brand_id).eq(is_active,true)`
  - `brand_pages.select.eq(slug, 'home')` (page builder data)

### `/c/ofertas` — `CustomerOffersPage.tsx`

- **Objetivo**: Browse ofertas com filtros
- **Componentes**: `<OfferFiltersBar>`, `<OfferGrid>`
- **Eventos**: tap em oferta → abre `<CustomerOfferDetailPage>` overlay
- **APIs**: `offers.select.eq(status,'ACTIVE')`, `stores.select` (JOIN), `customer_favorites.select`

### Detalhe oferta — `CustomerOfferDetailPage.tsx` (overlay)

- **Objetivo**: Detalhes + iniciar resgate
- **Campos**: nenhum (só leitura inicial)
- **Botões**:
  - "Resgatar agora" → abre `<CustomerRedeemCheckout>`
  - "Favoritar" → `customer_favorites.insert`
- **APIs**: `offers.select(id)`, `stores.select(offer.store_id)`

### Checkout — `CustomerRedeemCheckout.tsx`

- **Objetivo**: Fluxo de confirmação com OTP
- **Steps**:
  1. Selecionar loja (se múltiplas)
  2. Confirmar saldo suficiente (client + server)
  3. Solicitar OTP (R14)
  4. Digitar código
  5. Gerar QR code
- **Componentes**:
  - `<StoreSelector>`
  - `<OtpInput>` — 6 dígitos
  - `<QrCode>` — exibe após sucesso
- **Eventos**:
  - "Solicitar código" → invoke `send-otp-code`
  - "Verificar" → invoke `verify-otp-code` → `redemptions.insert`
- **APIs**:
  - edge function `send-otp-code` (R14)
  - edge function `verify-otp-code`
  - `redemptions.insert` (cria PENDING)
- **Validações** (R11, R14, R15):
  - Saldo >= value_rescue
  - OTP válido + não expirado + max 5 tentativas

### `/c/resgates` — `CustomerRedemptionsPage.tsx`

- **Objetivo**: Histórico de resgates do cliente
- **Componentes**:
  - `<ActiveRedemptionsList>` — PENDING ainda válidos (QR clicável)
  - `<HistoryList>` — USED/EXPIRED/CANCELED
- **APIs**: `redemptions.select.eq(customer_id)`

### `/c/carteira` — `CustomerWalletPage.tsx`

- **Objetivo**: Saldo + extrato
- **Componentes**:
  - `<BalanceCard>` — `points_balance` + `money_balance`
  - `<LedgerList>` — `points_ledger` entries
  - `<TierBadge>` — tier atual + progresso pro próximo
- **APIs**: `customers.select.eq(id)`, `points_ledger.select.eq(customer_id)`

### `/c/perfil` — `CustomerProfilePage.tsx`

- **Objetivo**: Editar dados do cliente
- **Campos**:
  - `name`, `cpf`, `phone`, `email`, `photo_url` (upload)
  - `notification_preferences` (toggles)
- **APIs**: `customers.update`, Storage upload pra foto
- **Validações**: mesma do admin (CPF, phone formato BR)

---

## 5.11 AUTH

### `/auth` — `Auth.tsx`

- **Objetivo**: Login/Signup de admin
- **Modes**: login, signup, forgot password
- **Campos**:
  - Login: email, password
  - Signup: full_name, email, password, confirm_password
  - Forgot: email
- **Eventos**:
  - Login → `supabase.auth.signInWithPassword`
  - Signup → `supabase.auth.signUp` + cria entry em `profiles`
  - Forgot → `supabase.auth.resetPasswordForEmail`
- **APIs**: Supabase Auth REST
- **Validações**:
  - Email RFC 5322
  - Senha min 8 chars

### `/reset-password` — `ResetPassword.tsx`

- **Objetivo**: Reset senha via link de email
- **Eventos**: submit → `supabase.auth.updateUser({ password })`

---

## 5.12 PÚBLICAS

### `/p/:slug` — `CustomPage.tsx`

- **Objetivo**: Landing customizada por brand (page builder)
- **APIs**: `brand_pages.select.eq(slug)`
- **Render**: parser de `page_data_json` → render dinâmico de seções

### `/landing` — `LandingPage.tsx`

- **Objetivo**: Landing comercial do SaaS
- **APIs**: nenhuma (estática)

---

## 5.13 Componentes compartilhados críticos

### `<BrandResolverProvider>`

- **Localização**: `src/contexts/brand/BrandResolverContext.tsx`
- **Objetivo**: Resolve brand do hostname/?brandId/role na boot
- **Provê**: `{ brand, loading, isWhiteLabel }`
- **Comportamento**: 1 RPC `get_boot_context` (F5.1)

### `<CustomerContext>`

- **Localização**: `src/contexts/CustomerContext.tsx`
- **Objetivo**: Provê customer logado (CPF + localStorage)
- **Provê**: `{ customer, login(cpf), logout, refetch }`

### `<AppLayout>`

- **Localização**: `src/components/AppLayout.tsx`
- **Objetivo**: Sidebar + header do admin
- **Permission gates**: usa `ModuleGuard` por item de menu

### `<CustomerLayout>`

- **Localização**: `src/components/customer/CustomerLayout.tsx`
- **Objetivo**: Tab navigation do storefront
- **Tabs visíveis**: dinâmico baseado em `brand_modules` habilitados

---

## 5.14 Padrões transversais

### Loading states

- **Skeleton**: TODA lista usa `<Skeleton>` do shadcn enquanto carrega
- **Spinner**: ações como submit usam `<Loader2 className="animate-spin">`
- **Fallback**: `<ErrorBoundary>` em rotas top-level

### Forms

- **Library**: `react-hook-form` + `zod` schema validation
- **Pattern**: schema em arquivo `*.schemas.ts` ao lado da página
- **Submit**: `toast.success`/`toast.error` via `sonner`

### Realtime

- **Sempre filtra** por `brand_id=eq.${X}` (F4.1) pra evitar cross-tenant streaming
- **Channel name** único: `${pageName}-realtime-${brandId}` ou `${entity}-realtime-${id}`
- **Cleanup**: useEffect retorna `() => supabase.removeChannel(channel)`

### Cache

- **React Query**:
  - `staleTime: 5min` default
  - `gcTime: 10min` default
  - `queryKeys` factory em `src/lib/queryKeys.ts`
  - Invalidação pós-mutation OU pós-Realtime event

---

> Fim da Fase 5. Voltar pro [README](./00-README.md).
