# 02-EDGE-FUNCTIONS.md — Funcoes de backend (Deno / Supabase Edge Functions)

Todas ficam em `supabase/functions/<nome>/index.ts` e rodam em Deno. Convencoes do projeto:

- Modulos compartilhados em `supabase/functions/_shared/` (logger, rate limiter, e-mail, OTP, fetch de corridas).
- CORS liberado (`Access-Control-Allow-Origin: *`) com tratamento explicito de `OPTIONS`.
- `verify_jwt = false` em `supabase/config.toml` para webhooks/cron/publicas; as demais exigem JWT do usuario.
- Funcoes de cron sao disparadas por `pg_cron` + `pg_net` usando a **ANON KEY** no header Authorization (service key nao é usada no `pg_net`).
- Segredos vem de variaveis de ambiente (`Deno.env.get`), nunca hardcoded.

## Indice

| Funcao | verify_jwt | Cron | Descricao curta |
|---|---|---|---|
| `admin-brand-actions` | false | — | — |
| `agent-api` | false | — | — |
| `apply-plan-template` | false | — | — |
| `check-expiring-favorites` | false | 0 * * * * (ativo) | — |
| `check-onboarding-alerts` | false | 0 */6 * * * (ativo), 0 */6 * * * (ativo) | — |
| `create-branch-admin` | true (default) | — | — |
| `create-checkout` | false | — | — |
| `driver-cpf-login` | true (default) | — | — |
| `driver-notifications-cron` | false | */5 * * * * (ativo) | — |
| `driver-upload-photo` | true (default) | — | — |
| `duelo-cron-advance` | false | 0 * * * * (ativo) | Cron — avanço de fases do Campeonato Duelo |
| `duelo-cron-reconcile` | false | 0 4 * * * (ativo) | Cron — reconciliação diária do motor de pontuação do Campeonato Duelo |
| `earn-webhook` | false | — | — |
| `enhance-image` | true (default) | — | — |
| `expire-pending-pins` | false | */15 * * * * (ativo) | — |
| `extract-products-from-image` | true (default) | — | — |
| `finalize-duels-cron` | false | */5 * * * * (ativo) | — |
| `import-drivers-bulk` | true (default) | — | — |
| `invite-brand-user` | false | — | — |
| `machine-webhook` | false | — | — |
| `match-taxonomy` | false | — | — |
| `mcp-server` | false | — | — |
| `mirror-sync` | true (default) | */10 * * * * (ativo), 0 0 * * * (ativo), 0 12 * * * (ativo), 0 18 * * * (ativo) | — |
| `mobility-webhook` | false | — | — |
| `notify-driver-points` | false | — | — |
| `provision-brand` | false | — | — |
| `provision-trial` | false | — | — |
| `register-machine-webhook` | false | — | — |
| `reset-duelo-ciclo` | true (default) | 5 0 * * * (ativo) | — |
| `retry-failed-rides` | false | — | — |
| `scrape-product` | false | — | — |
| `seed-demo-stores` | false | — | — |
| `send-driver-message` | true (default) | — | — |
| `send-otp-code` | true (default) | — | — |
| `send-push-notification` | false | — | — |
| `send-telegram-ride-notification` | false | — | — |
| `stripe-webhook` | false | — | — |
| `submit-commercial-lead` | true (default) | — | — |
| `test-machine-credentials` | false | — | — |
| `trial-reminders-cron` | true (default) | — | — |
| `validar-aposta-duelo` | true (default) | — | — |
| `verify-otp-code` | true (default) | — | — |

## Detalhe por funcao

### `admin-brand-actions`

- **Arquivo:** `supabase/functions/admin-brand-actions/index.ts` (858 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `campeonato_materialize_and_seed_season`
- **Tabelas acessadas:** `audit_logs`, `branch_points_wallet`, `branch_wallet_transactions`, `branches`, `brand_business_models`, `brand_modules`, `brands`, `campeonato_seasons`, `city_belt_champions`, `city_feed_events`, `customers`, `driver_duels`, `duel_side_bets`, `module_definitions`, `offers`, `plan_business_models`, `plan_module_templates`, `points_ledger`, `profiles`, `subscription_plans`, `user_roles`
- **Invoca outras functions:** nenhuma

### `agent-api`

- **Arquivo:** `supabase/functions/agent-api/index.ts` (672 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `AGENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `coupons`, `crm_tiers`, `customers`, `offers`, `points_ledger`, `redemptions`, `stores`, `tier_points_rules`
- **Invoca outras functions:** nenhuma

### `apply-plan-template`

- **Arquivo:** `supabase/functions/apply-plan-template/index.ts` (157 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `brand_modules`, `brands`, `module_definitions`, `plan_module_templates`, `subscription_plans`, `user_roles`
- **Invoca outras functions:** nenhuma

### `check-expiring-favorites`

- **Arquivo:** `supabase/functions/check-expiring-favorites/index.ts` (144 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** 0 * * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `customer_favorites`, `customer_notifications`, `push_subscriptions`
- **Invoca outras functions:** nenhuma

### `check-onboarding-alerts`

- **Arquivo:** `supabase/functions/check-onboarding-alerts/index.ts` (177 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** 0 */6 * * * (ativo), 0 */6 * * * (ativo)
- **Segredos / env:** `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TELEGRAM_API_KEY`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `branch_points_wallet`, `branches`, `driver_points_rules`, `machine_integrations`, `offers`, `points_rules`, `stores`
- **Invoca outras functions:** nenhuma

### `create-branch-admin`

- **Arquivo:** `supabase/functions/create-branch-admin/index.ts` (151 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `branch_points_wallet`, `brands`, `profiles`, `user_roles`
- **Invoca outras functions:** nenhuma

### `create-checkout`

- **Arquivo:** `supabase/functions/create-checkout/index.ts` (121 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `STRIPE_SECRET_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `brands`, `subscription_plans`
- **Invoca outras functions:** nenhuma

### `driver-cpf-login`

- **Arquivo:** `supabase/functions/driver-cpf-login/index.ts` (165 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `lookup_driver_by_cpf`
- **Tabelas acessadas:** `driver_login_ip_attempts`
- **Invoca outras functions:** nenhuma

### `driver-notifications-cron`

- **Arquivo:** `supabase/functions/driver-notifications-cron/index.ts` (359 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** */5 * * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `customers`, `error_logs`, `machine_integrations`, `machine_ride_notifications`, `machine_rides`
- **Invoca outras functions:** nenhuma

### `driver-upload-photo`

- **Arquivo:** `supabase/functions/driver-upload-photo/index.ts` (114 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `avatars`, `customers`
- **Invoca outras functions:** nenhuma

### `duelo-cron-advance`

- **Arquivo:** `supabase/functions/duelo-cron-advance/index.ts` (111 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** 0 * * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `campeonato_advance_phases`
- **Tabelas acessadas:** `campeonato_notifications`
- **Invoca outras functions:** `send-driver-message`
- **Proposito (comentario do arquivo):** Cron — avanço de fases do Campeonato Duelo. Roda a cada hora (UTC). Mantemos o schedule horário porque o RPC `campeonato_advance_phases` já lê `branches.timezone` por temporada e decide o avanço com base em `now()` comparado a janelas (`classification_ends_at`, `knockout_ends_at`) calculadas no fuso da cidade. Fixar o cron em "06:00 BRT" prejudicaria cidades em outros fusos — a granularidade horária garante atendimento universal. Notificações ao motorista (vitória / derrota / empate) são geradas dentro do próprio RPC via INSERT em `campeonato_notifications` (event_type: duelo_win, duelo_loss, duelo_draw). Após o RPC, esta função despacha as notificações recém-criadas via `send-driver-message` para entregar também no chat (TaxiMachine), quando a marca tiver integração ativa.

### `duelo-cron-reconcile`

- **Arquivo:** `supabase/functions/duelo-cron-reconcile/index.ts` (57 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** 0 4 * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `campeonato_reconcile_standings`
- **Tabelas acessadas:** nenhuma
- **Invoca outras functions:** nenhuma
- **Proposito (comentario do arquivo):** Cron — reconciliação diária do motor de pontuação do Campeonato Duelo. Recalcula pontos de classificações nas últimas 48h.

### `earn-webhook`

- **Arquivo:** `supabase/functions/earn-webhook/index.ts` (585 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `increment_customer_balance`
- **Tabelas acessadas:** `audit_logs`, `brand_api_keys`, `customers`, `earning_events`, `ganha_ganha_billing_events`, `ganha_ganha_config`, `ganha_ganha_store_fees`, `points_ledger`, `points_rules`, `store_points_rules`, `stores`, `tier_points_rules`
- **Invoca outras functions:** nenhuma

### `enhance-image`

- **Arquivo:** `supabase/functions/enhance-image/index.ts` (169 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `brand-assets`
- **Invoca outras functions:** nenhuma

### `expire-pending-pins`

- **Arquivo:** `supabase/functions/expire-pending-pins/index.ts` (45 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** */15 * * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `redemptions`
- **Invoca outras functions:** nenhuma

### `extract-products-from-image`

- **Arquivo:** `supabase/functions/extract-products-from-image/index.ts` (158 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** nenhuma
- **Invoca outras functions:** nenhuma

### `finalize-duels-cron`

- **Arquivo:** `supabase/functions/finalize-duels-cron/index.ts` (320 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** */5 * * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `finalize_duel`, `grant_duel_achievements`, `update_city_belt`
- **Tabelas acessadas:** `customer_notifications`, `driver_duels`
- **Invoca outras functions:** nenhuma

### `import-drivers-bulk`

- **Arquivo:** `supabase/functions/import-drivers-bulk/index.ts` (686 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `import_drivers_update_batch`
- **Tabelas acessadas:** `branches`, `customers`, `driver_import_jobs`, `driver_profiles`, `importacoes-motoristas`, `user_roles`
- **Invoca outras functions:** nenhuma

### `invite-brand-user`

- **Arquivo:** `supabase/functions/invite-brand-user/index.ts` (154 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `user_permission_overrides`, `user_roles`
- **Invoca outras functions:** nenhuma

### `machine-webhook`

- **Arquivo:** `supabase/functions/machine-webhook/index.ts` (1274 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `credit_customer_points`, `debit_branch_wallet`
- **Tabelas acessadas:** `audit_logs`, `branches`, `brands`, `crm_contacts`, `customers`, `driver_points_rules`, `driver_profiles`, `machine_integrations`, `machine_ride_events`, `machine_ride_notifications`, `machine_rides`, `points_rules`, `tier_points_rules`
- **Invoca outras functions:** nenhuma

### `match-taxonomy`

- **Arquivo:** `supabase/functions/match-taxonomy/index.ts` (238 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `segment_synonym_logs`, `taxonomy_segments`
- **Invoca outras functions:** nenhuma

### `mcp-server`

- **Arquivo:** `supabase/functions/mcp-server/index.ts` (282 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `AGENT_SECRET`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** nenhuma
- **Invoca outras functions:** nenhuma

### `mirror-sync`

- **Arquivo:** `supabase/functions/mirror-sync/index.ts` (115 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** */10 * * * * (ativo), 0 0 * * * (ativo), 0 12 * * * (ativo), 0 18 * * * (ativo)
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `mirror_sync_config`
- **Invoca outras functions:** nenhuma

### `mobility-webhook`

- **Arquivo:** `supabase/functions/mobility-webhook/index.ts` (137 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `MOBILITY_API_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `crm_contacts`, `crm_events`
- **Invoca outras functions:** nenhuma

### `notify-driver-points`

- **Arquivo:** `supabase/functions/notify-driver-points/index.ts` (327 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `customers`, `error_logs`, `machine_integrations`, `machine_ride_notifications`, `machine_rides`
- **Invoca outras functions:** nenhuma

### `provision-brand`

- **Arquivo:** `supabase/functions/provision-brand/index.ts` (878 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `has_role`, `seed_affiliate_categories`
- **Tabelas acessadas:** `affiliate_deal_categories`, `affiliate_deals`, `branch_points_wallet`, `branches`, `brand_domains`, `brand_modules`, `brand_section_sources`, `brand_sections`, `brands`, `customers`, `home_template_library`, `module_definitions`, `offers`, `plan_module_templates`, `points_ledger`, `profiles`, `store_catalog_items`, `stores`, `tenants`, `tier_points_rules`, `user_roles`
- **Invoca outras functions:** nenhuma

### `provision-trial`

- **Arquivo:** `supabase/functions/provision-trial/index.ts` (768 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `seed_affiliate_categories`
- **Tabelas acessadas:** `affiliate_deal_categories`, `affiliate_deals`, `branch_points_wallet`, `branches`, `brand_business_models`, `brand_domains`, `brand_modules`, `brand_sections`, `brands`, `customers`, `home_template_library`, `module_definitions`, `offers`, `plan_business_models`, `plan_module_templates`, `points_ledger`, `profiles`, `store_catalog_items`, `stores`, `subscription_plans`, `taxonomy_segments`, `tenants`, `tier_points_rules`, `user_roles`
- **Invoca outras functions:** nenhuma

### `register-machine-webhook`

- **Arquivo:** `supabase/functions/register-machine-webhook/index.ts` (225 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `audit_logs`, `brands`, `machine_integrations`, `user_roles`
- **Invoca outras functions:** nenhuma

### `reset-duelo-ciclo`

- **Arquivo:** `supabase/functions/reset-duelo-ciclo/index.ts` (234 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** 5 0 * * * (ativo)
- **Segredos / env:** `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `branches`, `customers`, `duel_cycle_reset_history`, `machine_rides`, `points_ledger`
- **Invoca outras functions:** nenhuma

### `retry-failed-rides`

- **Arquivo:** `supabase/functions/retry-failed-rides/index.ts` (409 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `increment_customer_balance`
- **Tabelas acessadas:** `branches`, `brands`, `customers`, `machine_integrations`, `machine_ride_notifications`, `machine_rides`, `points_ledger`
- **Invoca outras functions:** nenhuma

### `scrape-product`

- **Arquivo:** `supabase/functions/scrape-product/index.ts` (205 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** nenhuma
- **Invoca outras functions:** nenhuma

### `seed-demo-stores`

- **Arquivo:** `supabase/functions/seed-demo-stores/index.ts` (760 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** `seed_affiliate_categories`
- **Tabelas acessadas:** `affiliate_deal_categories`, `affiliate_deals`, `branches`, `brand_modules`, `brand_sections`, `brands`, `customers`, `module_definitions`, `offers`, `points_ledger`, `section_templates`, `store_catalog_items`, `stores`, `taxonomy_categories`, `taxonomy_segments`, `user_roles`
- **Invoca outras functions:** nenhuma

### `send-driver-message`

- **Arquivo:** `supabase/functions/send-driver-message/index.ts` (251 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `branches`, `customers`, `driver_message_flows`, `driver_message_logs`, `driver_message_templates`, `machine_integrations`
- **Invoca outras functions:** nenhuma

### `send-otp-code`

- **Arquivo:** `supabase/functions/send-otp-code/index.ts` (139 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `otp_codes`
- **Invoca outras functions:** nenhuma

### `send-push-notification`

- **Arquivo:** `supabase/functions/send-push-notification/index.ts` (163 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `customer_notifications`, `customers`
- **Invoca outras functions:** nenhuma

### `send-telegram-ride-notification`

- **Arquivo:** `supabase/functions/send-telegram-ride-notification/index.ts` (165 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `LOVABLE_API_KEY`, `TELEGRAM_API_KEY`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** nenhuma
- **Invoca outras functions:** nenhuma

### `stripe-webhook`

- **Arquivo:** `supabase/functions/stripe-webhook/index.ts` (169 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `brand_modules`, `brands`, `module_definitions`, `plan_module_templates`
- **Invoca outras functions:** nenhuma

### `submit-commercial-lead`

- **Arquivo:** `supabase/functions/submit-commercial-lead/index.ts` (132 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `admin_notifications`, `brands`, `commercial_leads`
- **Invoca outras functions:** nenhuma

### `test-machine-credentials`

- **Arquivo:** `supabase/functions/test-machine-credentials/index.ts` (111 linhas)
- **verify_jwt:** false
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `machine_integrations`
- **Invoca outras functions:** nenhuma

### `trial-reminders-cron`

- **Arquivo:** `supabase/functions/trial-reminders-cron/index.ts` (263 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `brands`, `user_roles`
- **Invoca outras functions:** nenhuma

### `validar-aposta-duelo`

- **Arquivo:** `supabase/functions/validar-aposta-duelo/index.ts` (81 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_ANON_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `branches`
- **Invoca outras functions:** nenhuma

### `verify-otp-code`

- **Arquivo:** `supabase/functions/verify-otp-code/index.ts` (139 linhas)
- **verify_jwt:** true (default — exige JWT)
- **Agendamento (pg_cron):** nao agendada
- **Segredos / env:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **RPCs chamadas:** nenhuma
- **Tabelas acessadas:** `otp_codes`
- **Invoca outras functions:** nenhuma
