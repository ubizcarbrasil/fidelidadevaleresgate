# Fase 2 — Engenharia Reversa da Arquitetura

Diagramas (ASCII + Mermaid) explicando como o sistema é montado, do
browser ao banco.

---

## 2.1 Visão geral (C4 — Sistema)

```mermaid
C4Context
    title Sistema Fidelidade + Resgate — Contexto

    Person(admin, "Admin da Brand", "Gerencia ofertas, vouchers, pontos, lojas")
    Person(customer, "Cliente Final", "Resgata pontos por ofertas")
    Person(store_op, "Operador de Loja", "Registra compras / valida QR")
    Person(root, "Root Admin (SaaS owner)", "Onboards novas brands")

    System(saas, "Fidelidade Vale Resgate", "SaaS multi-tenant de loyalty")

    System_Ext(pdv, "PDV Externo", "Sistema de loja que dispara webhook de compra")
    System_Ext(resend, "Resend", "Envia OTP por email")
    System_Ext(webpush, "Web Push Service", "Browser-to-device notification")
    System_Ext(stripe, "Stripe", "Cobrança da assinatura SaaS")

    Rel(admin, saas, "Gerencia via web admin")
    Rel(customer, saas, "Resgata via storefront /c/*")
    Rel(store_op, saas, "Valida QR via /pdv")
    Rel(root, saas, "Provisiona brands")

    Rel(pdv, saas, "POST /earn-webhook (API key)")
    Rel(saas, resend, "Envia OTP via API")
    Rel(saas, webpush, "Push notifications")
    Rel(saas, stripe, "Cobrança subscription")
```

### ASCII equivalente

```
                  ┌──────────────────────────────────────┐
                  │  Fidelidade Vale Resgate (SaaS)      │
                  │                                      │
   ┌──────────┐   │  ┌──────────┐    ┌────────────────┐  │
   │  Admin   │──▶│  │  Admin   │    │  Edge Functions│  │
   │  Brand   │   │  │  Web App │    │  (Deno)        │  │
   └──────────┘   │  └────┬─────┘    │                │  │
                  │       │          │ earn-webhook   │  │
   ┌──────────┐   │  ┌────▼─────┐    │ send-otp       │  │
   │  Cliente │──▶│  │ Customer │◀──▶│ verify-otp     │  │
   │  Final   │   │  │ Storefront    │ send-push      │  │
   └──────────┘   │  └────┬─────┘    │ stripe-webhook │  │
                  │       │          └─────┬──────────┘  │
   ┌──────────┐   │  ┌────▼──────────┐     │             │
   │ Operador │──▶│  │ /pdv (valida QR)    │             │
   │  Loja    │   │  └──────┬────────┘     │             │
   └──────────┘   │         │              │             │
                  │      ┌──▼──────────────▼──┐          │
   ┌──────────┐   │      │  Supabase Postgres │          │
   │   PDV    │──▶│      │  + RLS + RPCs      │          │
   │ Externo  │   │      │  + Realtime        │          │
   └──────────┘   │      └────────────────────┘          │
                  └──────────────────────────────────────┘
                          │             │              │
                          ▼             ▼              ▼
                       Resend     Web Push       Stripe
                       (email)     Service        (billing)
```

---

## 2.2 Camadas (C4 — Container)

```mermaid
C4Container
    title Containers — Fidelidade + Resgate

    Person(admin, "Admin")
    Person(customer, "Cliente")

    System_Boundary(saas, "SaaS") {
      Container(spa, "SPA React", "Vite/React/TS/Tailwind", "Bundle servido via CDN Lovable")
      Container(pwa, "PWA Worker", "Workbox", "Cache + offline")
      Container(supa_auth, "Supabase Auth", "GoTrue", "Login admin (email/senha)")
      Container(supa_db, "Postgres DB", "Postgres 15 + extensões", "Tables + RLS + RPCs + triggers")
      Container(supa_fn, "Edge Functions", "Deno runtime", "earn-webhook, OTP, push")
      Container(supa_st, "Storage", "S3-like", "Avatars + brand assets")
      Container(supa_rt, "Realtime", "WebSocket", "postgres_changes subscribe")
    }

    System_Ext(resend, "Resend")
    System_Ext(webpush_ext, "Web Push")

    Rel(admin, spa, "HTTPS")
    Rel(customer, spa, "HTTPS")
    Rel(spa, pwa, "Service Worker")
    Rel(spa, supa_auth, "JWT login")
    Rel(spa, supa_db, "REST + JWT (RLS)")
    Rel(spa, supa_fn, "Invoke functions")
    Rel(spa, supa_st, "Upload/Download")
    Rel(spa, supa_rt, "WebSocket subscribe")
    Rel(supa_fn, supa_db, "Service role")
    Rel(supa_fn, resend, "HTTPS POST")
    Rel(supa_fn, webpush_ext, "HTTPS POST")
```

---

## 2.3 Multi-tenancy

```
                    ┌────────────────────────────────┐
                    │  Resolução de Brand            │
                    └───────────────┬────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
        Hostname match         ?brandId param     User roles
        (brand_domains)        (URL query)        (auth user)
                │                   │                   │
                └──────────► get_boot_context ◄─────────┘
                                    │ (1 RPC)
                                    ▼
                    ┌──────────────────────────────┐
                    │  Brand resolvida + branches  │
                    │  + theme + roles             │
                    └──────────────┬───────────────┘
                                   │
                       Context React (BrandResolverContext)
                                   │
                                   ▼
                           ╔═══════════════╗
                           ║  RLS filtra   ║
                           ║  por brand_id ║
                           ║  em CADA      ║
                           ║  query        ║
                           ╚═══════════════╝
```

**Garantias de isolamento**:
- TODA tabela do escopo tem `brand_id` (FK NOT NULL)
- RLS policy padrão: `USING (brand_id = ANY(get_user_brand_ids(auth.uid())))`
- Trigger `validate_branch_integrity` bloqueia INSERT/UPDATE com `branch_id` de outra `brand_id`
- Edge functions com service_role validam `brand_id` no body antes de qualquer write

### Hierarquia

```
tenant (1 — o operador do SaaS)
   └── brand (N — clientes do SaaS / white-label)
         └── branch (N — cidades operadas pela brand)
               └── store (N — lojas dentro da cidade)
                     └── offer (N — ofertas da loja)

customer (vinculado a 1 brand + 1 branch corrente)
   └── points_ledger entries
   └── redemptions
   └── earning_events
```

---

## 2.4 Autenticação & Autorização

```mermaid
sequenceDiagram
    actor Admin
    participant SPA as React SPA
    participant Auth as Supabase Auth
    participant DB as Postgres

    Admin->>SPA: Submit email + senha em /auth
    SPA->>Auth: signInWithPassword
    Auth->>SPA: { user, session: JWT }
    SPA->>SPA: store JWT in localStorage
    SPA->>DB: SELECT user_roles WHERE user_id=auth.uid()
    DB->>SPA: [{role:'brand_admin', brand_id: X}]
    SPA->>SPA: BrandContext resolve brand X
    SPA->>DB: SELECT * FROM customers (com JWT no header)
    Note over DB: RLS verifica:<br/>has_role(auth.uid(), 'brand_admin', X)<br/>OR brand_id = ANY(get_user_brand_ids())
    DB->>SPA: rows filtradas por brand X
```

### Customer storefront (sem auth.users)

```mermaid
sequenceDiagram
    actor Cliente
    participant SPA
    participant DB
    participant OTP as send-otp-code edge fn

    Cliente->>SPA: Acessa /c/?brandId=X
    SPA->>DB: SELECT customers WHERE cpf=? AND brand_id=X
    DB->>SPA: customer (ou null)
    alt Customer existe
      SPA->>SPA: armazena customer_id em localStorage
      SPA->>SPA: CustomerContext provê customer
    else Não existe
      SPA->>OTP: Solicita OTP por SMS/email
      OTP->>DB: INSERT otp_codes (hash SHA-256)
      OTP->>Cliente: Envia código
      Cliente->>SPA: Digita código
      SPA->>DB: verify-otp + INSERT customers
    end
```

**Modelo de auth do customer**:
- NÃO usa `auth.users` (admin-only)
- CPF + `brand_id` é a tupla de identidade
- `customers.id` é UUID interno
- `localStorage` guarda customer_id para sessão persistente
- OTP server-side (PR #35) protege troca de identidade

---

## 2.5 Fluxo de pontuação (earning)

```mermaid
sequenceDiagram
    actor Operador
    participant SPA as /earn-points
    participant RPC as credit_customer_points
    participant DB
    participant Trigger as update_customer_balance

    Operador->>SPA: Busca cliente por CPF
    SPA->>DB: SELECT customers WHERE cpf=?
    DB->>SPA: customer
    Operador->>SPA: Digita valor compra (R$ 50,00)
    SPA->>SPA: Calcula pontos = valor * points_rule.points_per_real<br/>+ aplica tier multiplier
    SPA->>RPC: credit_customer_points(customer_id, brand_id, branch_id, points, value, 'STORE_PDV', ...)
    RPC->>DB: INSERT earning_events
    RPC->>DB: INSERT points_ledger (entry_type='CREDIT')
    Trigger->>DB: UPDATE customers SET points_balance = points_balance + points
    RPC->>SPA: { event_id, new_balance }
    SPA->>Operador: ✓ "50 pontos creditados"
```

**Via webhook (PDV externo)**:
```mermaid
sequenceDiagram
    participant PDV as PDV Externo
    participant Edge as earn-webhook
    participant DB

    PDV->>Edge: POST /functions/v1/earn-webhook<br/>headers: x-api-key<br/>body: {cpf, value, store_id}
    Edge->>DB: validate api_key → brand_id + branch_id
    Edge->>DB: validate rate limit (rate_limit_entries)
    Edge->>DB: SELECT customers (cria se não existir)
    Edge->>DB: calc pontos via points_rules
    Edge->>DB: INSERT earning_events + points_ledger (transação)
    Edge->>PDV: 200 { event_id, points_credited }
```

---

## 2.6 Fluxo de resgate (redemption)

```mermaid
sequenceDiagram
    actor Cliente
    participant SPA as /c/ofertas
    participant DB
    participant OTP as send-otp-code

    Cliente->>SPA: Tap em uma oferta
    SPA->>DB: SELECT offers WHERE id=? AND status='ACTIVE'
    DB->>SPA: offer
    Cliente->>SPA: Selecionar loja + confirmar
    SPA->>SPA: Valida: customer.points_balance >= offer.points_cost
    SPA->>OTP: invoke send-otp-code(customer_id, purpose='redeem')
    OTP->>Cliente: Email/SMS com código
    Cliente->>SPA: Digita código
    SPA->>SPA: invoke verify-otp-code
    SPA->>DB: INSERT redemptions (status='PENDING', token=uuid, qr_data=base64)
    DB->>DB: trigger calcula expires_at = now() + 24h
    DB->>DB: trigger debita pontos via points_ledger (DEBIT)
    DB->>SPA: redemption { id, token, qr_data, expires_at }
    SPA->>Cliente: Exibe QR Code

    Note over Cliente: Cliente vai até a loja
    actor Loja as Operador Loja
    Loja->>SPA: Scan QR em /pdv
    SPA->>DB: SELECT redemptions WHERE token=?<br/>AND status='PENDING'<br/>AND expires_at > now()
    DB->>SPA: redemption + offer + customer
    Loja->>SPA: Confirma uso
    SPA->>DB: UPDATE redemptions SET status='USED', used_at=now()
```

---

## 2.7 Realtime (postgres_changes)

```
        ┌─────────────────────────────────┐
        │ Dashboard/Customer/Store Owner  │
        └──────────────┬──────────────────┘
                       │ subscribe
                       ▼
        ┌─────────────────────────────────────┐
        │  Supabase Realtime (WebSocket)      │
        │                                     │
        │  channel: 'dashboard-realtime-${X}' │
        │  filter:  'brand_id=eq.X'  ← PR #37 │
        │                                     │
        │  events: redemptions, machine_rides,│
        │           customers, offers (INSERT)│
        └─────────────────┬───────────────────┘
                          │
                          ▼
            queryClient.invalidateQueries(...)
                          │
                          ▼
                  Re-fetch & re-render
```

Sem o `filter: brand_id=eq.X` (corrigido na F4.1), o servidor mandava
events de TODAS as brands pra TODOS os subscribers, multiplicando custo
de bandwidth por N tenants.

---

## 2.8 Camadas de cache

```
              ┌──────────────────────────┐
              │   Browser (cliente)      │
              └────────────┬─────────────┘
                           │
              ┌────────────▼────────────────────┐
              │  React Query (TanStack)         │
              │  staleTime: 5min, gcTime: 10min │
              │  invalidate via Realtime        │
              └────────────┬────────────────────┘
                           │ miss
              ┌────────────▼────────────────────┐
              │  Service Worker (Workbox)       │
              │  cache assets + manifest        │
              └────────────┬────────────────────┘
                           │ miss
              ┌────────────▼────────────────────┐
              │  Lovable CDN                    │
              └────────────┬────────────────────┘
                           │ miss
              ┌────────────▼────────────────────┐
              │  Supabase REST API              │
              │  (Postgres + RLS + índices)     │
              └─────────────────────────────────┘
```

### Boot context (1 RPC em vez de 5-7 queries)

Antes do `get_boot_context`, o boot fazia em paralelo:
1. `user_roles` SELECT
2. `brand_domains` por subdomain
3. `brand_domains` por domain (fallback)
4. `brands` ou `public_brands_safe`
5. `profiles` (selected_branch_id)
6. `branches` lista

Em 5G/iOS Safari, essa rajada fazia HTTP/2 abortar conexões.
A RPC unificada consolida em 1 round-trip.

---

## 2.9 Webhooks (entrada e saída)

### Entrada (recebemos)

| Webhook | Auth | Endpoint | Trigger |
|---|---|---|---|
| **earn-webhook** | `x-api-key` header (validado contra `brand_api_keys`) | `/functions/v1/earn-webhook` | PDV externo registra compra |
| **stripe-webhook** | Signature header validado contra `STRIPE_WEBHOOK_SECRET` | `/functions/v1/stripe-webhook` | Stripe notifica de cobrança paga/falha |

### Saída (enviamos)

| Para | Trigger | Função |
|---|---|---|
| **Resend (email)** | `send-otp-code` | OTP de cliente fazendo signup/resgate |
| **Web Push** | `send-push-notification` | Notificação de oferta expirando, resgate pronto, etc |

---

## 2.10 Processamento assíncrono

```
        ┌────────────────────────────────────┐
        │  Edge Function (Deno)              │
        │  EdgeRuntime.waitUntil(promise)    │
        └─────────────┬──────────────────────┘
                      │
              ┌───────▼──────┐
              │ Response 200 │ ← cliente já desconectou
              └──────────────┘
                      │
        ┌─────────────▼──────────────────────┐
        │ Background work continua:          │
        │  - import-drivers-bulk: chunked    │
        │    de 500 rows (job em DB)         │
        │  - mirror-sync: scrape + categorize│
        │  - send-push: paralelo pra N subs  │
        └────────────────────────────────────┘
```

**Padrão atual** (sem fila):
- Workload longo: `EdgeRuntime.waitUntil()` no Deno
- Estado persistido em tabela de "jobs" (ex: `driver_import_jobs`)
- UI poll job_id periodicamente pra ver progresso
- Cleanup defensivo via `cleanup_stuck_*_jobs` cron (F5.4)

**Não tem**: SQS/RabbitMQ/queue real. Se workload crescer demais,
candidato a migrar pra fila gerenciada (Inngest, Trigger.dev, AWS SQS).

---

## 2.11 Diagrama de dependências (módulos)

```mermaid
graph LR
    A[App.tsx] --> B[AuthContext]
    A --> C[BrandResolverContext]
    A --> D[QueryClientProvider]
    C --> E[BrandDataContext]
    E --> F[BrandThemeContext]

    G[/admin/EarnPointsPage] --> C
    G --> H[earningService]
    H --> I[(supabase.rpc credit_customer_points)]
    I --> J[(points_ledger + earning_events)]
    J --> K[trigger: update_customer_balance]
    K --> L[(customers.points_balance)]

    M[/c/ofertas] --> N[CustomerContext]
    M --> O[CustomerRedeemFlow]
    O --> P[send-otp-code edge fn]
    P --> Q[Resend API]
    O --> R[verify-otp-code edge fn]
    O --> S[(redemptions INSERT)]
    S --> T[trigger: debita pontos]
```

---

## 2.12 Decisões arquiteturais críticas

| ADR | Decisão | Por quê | Trade-off |
|---|---|---|---|
| 1 | **Multi-tenant via RLS + `brand_id`** (não schema por tenant) | Simplicidade operacional. 1 DB pra todos. | RLS bug = vazamento cross-tenant. Mitigado por testes (`rlsCrossTenant.test.ts`) + trigger `validate_branch_integrity`. |
| 2 | **Customer auth = CPF + localStorage** (sem `auth.users`) | UX mobile: cliente não cria conta, só CPF. | localStorage perde-se em troca de device. OTP recupera. |
| 3 | **Ledger immutable + balance materializado** | Auditabilidade total + perf de read. | Bug em trigger = balance desincronizado. Reconciliação periódica via `reconcile_*` RPCs. |
| 4 | **Edge functions Deno** (não Lambda/Vercel fn) | Co-localização com Supabase, latência menor BR. | Limite 50MB bundle, sem long-running >60s. |
| 5 | **React Query pra todo state remoto** | Cache + invalidação + retry built-in. | Necessita disciplina com queryKeys. Factory em `queryKeys.ts`. |
| 6 | **Realtime via postgres_changes** (não Pusher/Ably) | Embutido no Supabase, JWT auth direto. | Acoplado ao Supabase (vendor lock-in). |
| 7 | **PWA com manifest dinâmico** | Cada brand = "app" diferente (logo/cor/nome). | Service worker complexo, cache hits diferentes por brand. |
| 8 | **Sem fila gerenciada** (background via `waitUntil`) | Menos infra pra rodar. | Workload longo (>60s) não suportado. |

---

> Próxima fase: [03-modelagem-banco.md](./03-modelagem-banco.md) — DDL completo.
