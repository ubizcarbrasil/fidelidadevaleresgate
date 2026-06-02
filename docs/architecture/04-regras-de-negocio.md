# Fase 4 — Regras de Negócio (Loyalty + Redeem)

Catálogo das regras de negócio extraídas do código (services, RPCs, triggers).
Cada regra documentada em formato padronizado.

---

## 4.1 Regras de Pontuação (Earning)

### R1. Cálculo de pontos por compra

- **Regra**: cliente ganha pontos proporcional ao valor da compra
- **Objetivo**: incentivar consumo recorrente
- **Entrada**: `customer_id`, `store_id`, `purchase_value` (R$)
- **Processamento**:
  1. Carrega `points_rules` ativa pra `brand_id` (fallback `branch_id` específico se existir)
  2. Carrega `store_points_rules` se existir override aprovado pra essa loja
  3. Carrega `tier_points_rules` do tier do cliente
  4. Pontos = `purchase_value * effective_points_per_real`
     - `effective` = override de loja se ativo, senão tier multiplier, senão regra base
  5. Aplica clamp: `min(pontos, max_points_per_purchase)`
- **Saída**: integer (pontos a creditar)
- **Exceções**:
  - Se `purchase_value < min_purchase_to_earn` → rejeita com motivo `BELOW_MIN_PURCHASE`
  - Se `require_receipt_code = true` e nenhum `receipt_code` informado → rejeita
- **Implementação**: `src/modules/loyalty/services/earningService.ts:calculatePoints()`

### R2. Limite diário por cliente

- **Regra**: cliente não pode ganhar mais que N pontos no mesmo dia (cumulativo)
- **Objetivo**: prevenir abuso/lavagem de pontos
- **Entrada**: `customer_id`, `points_to_add`
- **Processamento**:
  1. Soma `points_earned` de `earning_events` do cliente HOJE (uso de `todayStartISO()` em fuso BR, F1)
  2. Se `soma + points_to_add > max_points_per_customer_per_day` → rejeita
- **Saída**: `{ allowed: boolean, reason?: 'EXCEEDS_CUSTOMER_DAILY_LIMIT' }`
- **Exceções**: admin com role `root_admin` pode forçar via flag
- **Implementação**: `earningService.checkDailyLimits()`

### R3. Limite diário por loja

- **Regra**: cada loja não pode distribuir mais que N pontos por dia
- **Objetivo**: controlar despesa total da brand com loja-emissora
- **Entrada**: `store_id`, `points_to_add`
- **Processamento**: análogo a R2 mas agregando por `store_id`
- **Exceções**: nenhuma

### R4. Receipt code único por brand

- **Regra**: mesmo `receipt_code` não pode ser usado 2x na mesma brand
- **Objetivo**: prevenir lançamento duplicado da mesma nota fiscal
- **Processamento**: índice parcial `idx_earning_events_receipt(brand_id, receipt_code) WHERE receipt_code IS NOT NULL`
- **Exceção**: erro `unique_violation` → frontend exibe "Cupom já registrado"

### R5. Crédito atômico no ledger

- **Regra**: ao creditar pontos, criar `earning_event` + `points_ledger` na MESMA transação
- **Objetivo**: balance sempre coerente com ledger (auditabilidade)
- **Implementação**: RPC `credit_customer_points(...)` faz ambos em PL/pgSQL = 1 tx ACID
- **Trigger**: `trg_update_customer_balance` atualiza `customers.points_balance` automaticamente

---

## 4.2 Regras de Resgate (Redemption)

### R10. Cliente só resgata oferta ACTIVE

- **Regra**: só `offers.status = 'ACTIVE' AND is_active = true` aparecem pro cliente
- **Saída**: RLS policy `Anon read active offers` filtra
- **Exceção**: admin com role lê todas

### R11. Saldo suficiente

- **Regra**: cliente precisa ter `points_balance >= offer.value_rescue`
- **Quando valida**: client-side (UX) E server-side (RLS + trigger no points_ledger)
- **Falha**: rejeita com `INSUFFICIENT_BALANCE`

### R12. Janela de horário e weekday

- **Regra**: oferta tem `allowed_weekdays` (array de 0-6) e `allowed_hours` (string `HH:MM-HH:MM`)
- **Quando valida**:
  - Client-side: filtro de exibição em `/c/ofertas`
  - Server-side: trigger no INSERT de `redemptions` (TODO — atualmente só client)
- **Edge case**: se `allowed_hours = NULL`, vale 24/7. Se `allowed_weekdays = '{0..6}'`, vale todo dia.

### R13. Limite diário de resgate por oferta

- **Regra**: `offers.max_daily_redemptions` define teto de N resgates por dia daquela oferta
- **Processamento**: count `redemptions WHERE offer_id=? AND created_at >= todayStartISO()`
- **Falha**: `OFFER_DAILY_LIMIT_REACHED`

### R14. OTP obrigatório no checkout (F2)

- **Regra**: antes de confirmar resgate, cliente recebe e digita código OTP
- **Objetivo**: prevenir bypass via DevTools (era vulnerabilidade crítica)
- **Implementação**:
  - Frontend chama `send-otp-code` edge function
  - Server gera código random 6 dígitos, hash SHA-256, persiste com TTL 10min
  - Cliente digita → frontend chama `verify-otp-code` edge function
  - Server compara hashes, marca `used=true` atomicamente
- **Limites**: 5 attempts por código, bloqueia após
- **Edge function**: `supabase/functions/{send,verify}-otp-code/`

### R15. QR token único e expirável

- **Regra**: cada `redemption` tem `token` (UUID hex) que vira QR code
- **TTL**: 24h após criação (trigger `set_redemption_expires_at`)
- **Estado**: PENDING (criado) → USED (loja confirmou) → EXPIRED (passou TTL) → CANCELED (cliente cancelou)
- **Idempotência**: UPDATE atômico `WHERE status='PENDING'` previne double-use em retry

### R16. Estorno de resgate (refund)

- **Regra**: ao cancelar `redemption` ou rejeitar `product_redemption_order`, devolver pontos ao cliente
- **Implementação**: RPC `refund_customer_points(p_customer_id, p_brand_id, p_branch_id, p_points, p_reason, p_reference_type, p_reference_id, p_created_by_user_id)`
- **Resultado**: cria `points_ledger` entry com `entry_type='CREDIT'` e `reference_type='MANUAL_ADJUSTMENT'`

### R17. Validação cross-tenant na redemption

- **Regra**: `redemption.brand_id` deve bater com `offer.brand_id` E com `customer.brand_id`
- **Implementação**: trigger `validate_redemption_branch()` BEFORE INSERT/UPDATE
- **Por que**: defense-in-depth. RLS já filtra mas trigger garante mesmo com service_role

---

## 4.3 Regras de Tier do Cliente

### R20. Tiers disponíveis

- INICIANTE (default novo cliente)
- BRONZE
- PRATA
- OURO
- GALÁTICO

### R21. Promoção automática de tier

- **Regra**: cliente sobe de tier quando atinge threshold de pontos acumulados (lifetime)
- **Thresholds** (configurável em `customer_tier_config` por brand):
  - BRONZE: 1.000 pontos lifetime
  - PRATA: 5.000
  - OURO: 15.000
  - GALÁTICO: 50.000
- **Quando avalia**: trigger `evaluate_customer_tier` AFTER INSERT no `points_ledger`
- **Saída**: atualiza `customers.customer_tier`

### R22. Multiplicador por tier (TIERED rule)

- **Regra**: se `points_rules.rule_type = 'TIERED'`, usa `tier_points_rules.points_per_real` em vez do default
- **Exemplo**: BRONZE = 1x, PRATA = 1.5x, OURO = 2x, GALÁTICO = 3x

---

## 4.4 Regras de Vouchers

### R30. Status do voucher

- `active` (criado, dentro de prazo)
- `expired` (passou `expires_at`)
- `depleted` (atingiu `max_uses`)
- `cancelled` (admin cancelou manualmente)

### R31. Uso de voucher

- **Regra**: ao chamar `redeem_voucher(code)`:
  1. Busca voucher por código + brand_id (UNIQUE(code, branch_id))
  2. Valida `status = 'active'` E `expires_at > now()` E `current_uses < max_uses`
  3. INSERT em `voucher_redemptions`
  4. UPDATE `vouchers SET current_uses = current_uses + 1`
  5. Se atingiu `max_uses`, marca `status = 'depleted'`
- **Saída**: dados do voucher (% off ou valor fixo) pra aplicar
- **Idempotência**: NÃO impede mesmo customer usar 2x (deveria, mas não está implementado)

---

## 4.5 Regras de Notificação

### R40. Notificações in-app

- Tipos: `OFFER_EXPIRING`, `REDEMPTION_READY`, `POINTS_CREDITED`, `STORE_OPENED_NEAR_YOU`, `WELCOME`
- Triggers: cron job + on-event (após ledger insert, redemption status change)
- Storage: `customer_notifications`
- UI: badge no header + drawer com lista

### R41. Web Push

- **Pré-requisito**: cliente aceitou permissão e tem `push_subscriptions` ativa
- **Envio**: edge function `send-push-notification` paraleliza fetch pra cada endpoint
- **Falha silenciosa**: endpoint inválido (410 Gone) → DELETE da subscription
- **Quando**:
  - Resgate processado (state change)
  - Oferta expirando em 24h (cron)
  - Anúncio admin (manual)

---

## 4.6 Regras de Pagamento e Wallet

### R50. Compra de pacote de pontos

- **Regra**: branch compra pacote de pontos do tenant operador
- **Fluxo**:
  1. `purchased_by` cria `points_package_orders.status='PENDING'`
  2. Pagamento offline (PIX/boleto) — TODO: integrar gateway
  3. Admin confirma via `confirm_package_order(order_id)` RPC
  4. RPC cria `branch_wallet_transactions.LOAD` + atualiza `branch_points_wallet.balance`
- **Implementação**: RPC `confirm_package_order`

### R51. Débito da wallet ao distribuir pontos

- **Regra**: quando cliente ganha pontos via `earning_event`, debitar `branch_points_wallet.balance`
- **Implementação**: RPC `debit_branch_wallet(branch_id, amount)` chamado dentro de `credit_customer_points`
- **Exceção**: se balance insuficiente → rejeita com `BRANCH_WALLET_DEPLETED`

---

## 4.7 Regras de Multi-tenancy (cross-tenant)

### R60. Toda escrita valida brand_id

- **Regra**: INSERT/UPDATE em qualquer tabela com `brand_id` é bloqueado se user não tem role naquela brand
- **Implementação**: RLS `WITH CHECK` clauses + helper `get_user_brand_ids(auth.uid())`
- **Edge case**: service_role bypassa RLS, mas edge functions validam manualmente

### R61. Branch deve pertencer ao brand_id

- **Regra**: em qualquer tabela com `brand_id + branch_id`, `branch.brand_id = brand_id`
- **Trigger**: `validate_branch_integrity` em redemptions, offers, earning_events
- **Por que**: RLS pode falhar se admin tem múltiplas brands; trigger garante consistência

### R62. Customer pertence a 1 brand

- **Regra**: 1 CPF pode existir em N brands (cliente pode estar em programas diferentes)
- **Lookup**: `WHERE cpf = ? AND brand_id = ?` (não há UNIQUE só em cpf)
- **Implicação**: cliente que troca de brand precisa novo cadastro (sem migração automática)

---

## 4.8 Regras de Timezone (F1)

### R70. Storage em UTC, exibição em fuso BR

- **Regra**: TODOS `timestamptz` salvos em UTC
- **Exibição**: convertidos pra `America/Sao_Paulo` via helpers em `src/lib/dateTz.ts`

### R71. Business day = 00:00-23:59 Brasil

- **Regra**: "hoje" significa 00:00-23:59 no fuso da branch (default São Paulo, override em `branches.timezone`)
- **Crítico em**: limit diário de pontos, billing mensal (GanhaGanha), expiração de oferta
- **Bug histórico**: usar `new Date().toISOString().slice(0,7)` causava billing em mês errado pra transações 21h+

### R72. Helpers obrigatórios

- `todayStartISO(tz)` — início do dia BR em ISO UTC
- `dateRangeISO(from, to, tz)` — range de input HTML date pra ISO UTC
- `yearMonthInTz(date, tz)` — "YYYY-MM" no fuso correto
- Documentação completa em `src/lib/dateTz.ts`

---

## 4.9 Regras de Importação CSV (F5.4)

### R80. Import de motoristas/clientes em transação

- **Regra**: cada chunk de 500 rows = 1 transação ACID
- **Implementação**: RPC `import_drivers_update_batch(p_updates jsonb)` faz UPDATEs em batch
- **Failure mode**: chunk inteiro rollback se qualquer linha falhar
- **Continuidade**: try/catch envelopa cada chunk; falha de 1 chunk não mata job

### R81. Matching de cliente

- **Ordem**: external_driver_id → cpf → phone → name (normalizado)
- **Match**: UPDATE; sem match: INSERT
- **Idempotência**: re-rodar mesmo CSV não duplica (matching pega registros já criados)

### R82. Job órfão = erro

- **Regra**: job em `status='running'` há > 30min é considerado órfão (edge function crashou)
- **Cleanup**: RPC `cleanup_stuck_driver_import_jobs(p_max_age_minutes default 30)`
- **Cron sugerido**: rodar a cada 5min via pg_cron

---

## 4.10 Regras de Rate Limit (F4.3)

### R90. Rate limit em edge functions públicas

| Função | Limite | Por |
|---|---|---|
| `send-otp-code` | 5/15min | identifier |
| `verify-otp-code` | 30/10min | IP |
| `submit-commercial-lead` | 3/1h | IP |
| `driver-upload-photo` | 10/5min | driver_id |
| `enhance-image` | 5/10min | brand |
| `extract-products-from-image` | 5/10min | brand |
| `scrape-product` | 20/10min | brand |
| `create-checkout` | 10/10min | brand |

- **Backend**: tabela `rate_limit_entries` com sliding window
- **Helper**: `supabase/functions/_shared/rateLimiter.ts`
- **Response**: 429 com `retry_after_seconds`

---

## 4.11 Regras de Boot do App (F5.1)

### R100. Resolução de brand

- **Ordem**:
  1. `?brandId=...` query param → fetch brand direto
  2. Hostname match em `brand_domains` (subdomain ou full domain)
  3. Se logged in, role com `brand_id` → fetch brand
  4. Caso contrário, modo localhost/portal sem brand

### R101. Boot context unificado

- **Regra**: 1 RPC `get_boot_context(p_hostname, p_brand_id)` substitui 5-7 queries paralelas
- **Por quê**: HTTP/2 abort em 5G/iOS Safari travava boot por minutos
- **Timeout defensivo**: 6s, depois fallback pra fluxo legado de queries separadas

---

## 4.12 Regras de Estado do Customer (Tiers, Journey)

### R110. Journey stages

Categorias auto-calculadas pra CRM:
- `new` — criado nos últimos 30d com ≤ 2 earnings
- `engaging` — entre new e loyal
- `loyal` — ≥ 5 earnings + ≥ 2 redemptions
- `at_risk` — sem atividade 30-60d
- `lost` — sem atividade > 60d

### R111. Health score da base

```
healthScore = ((active + new) / total) * 100 - (lost / total) * 30
```

- 100 = todos ativos
- 0 ou negativo = base morta

---

## 4.13 Triggers especiais

### T1. update_customer_balance_from_ledger

- **When**: AFTER INSERT no `points_ledger`
- **Action**: UPDATE `customers.points_balance` (+ ou - conforme entry_type)

### T2. set_redemption_expires_at

- **When**: BEFORE INSERT no `redemptions`
- **Action**: define `expires_at = created_at + 24h` se NULL

### T3. validate_offer_branch / validate_redemption_branch

- **When**: BEFORE INSERT/UPDATE
- **Action**: verifica integridade brand+branch cruzada (R17, R61)

### T4. update_updated_at_column

- **When**: BEFORE UPDATE em quase toda tabela
- **Action**: `NEW.updated_at = now()`

### T5. cleanup_stuck_driver_import_jobs (F5.4)

- **When**: cron (sugestão 5min) ou manual
- **Action**: marca jobs `status='running' AND started_at < now() - 30min` como `'error'`

---

## 4.14 RPCs principais (assinatura completa)

```sql
-- Crédito atômico de pontos
credit_customer_points(
  p_customer_id UUID,
  p_brand_id UUID,
  p_branch_id UUID,
  p_points INTEGER,
  p_money NUMERIC,
  p_source earning_source,
  p_reference_type ledger_reference_type,
  p_reference_id UUID,
  p_created_by_user_id UUID
) RETURNS JSONB
-- { event_id, new_balance }

-- Estorno de resgate
refund_customer_points(
  p_customer_id UUID,
  p_brand_id UUID,
  p_branch_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_created_by_user_id UUID
) RETURNS JSONB

-- Boot context unificado
get_boot_context(
  p_hostname TEXT DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL
) RETURNS JSONB
-- { user_id, brand_id, brand, roles, profile, branches, server_time }

-- Confirma compra de pacote (loads balance)
confirm_package_order(
  p_order_id UUID
) RETURNS JSONB
```

---

> Próxima fase: [05-mapeamento-telas.md](./05-mapeamento-telas.md)
