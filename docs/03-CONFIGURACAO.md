# 03-CONFIGURACAO.md — Configuracao, variaveis, segredos e build

## 1. Stack e versoes (package.json)

| Pacote | Versao |
|---|---|
| `react` | `^18.3.1` |
| `react-dom` | `^18.3.1` |
| `react-router-dom` | `^6.30.1` |
| `vite` | `^5.4.19` |
| `typescript` | `^5.8.3` |
| `tailwindcss` | `^3.4.17` |
| `@supabase/supabase-js` | `^2.98.0` |
| `@tanstack/react-query` | `^5.62.0` |
| `framer-motion` | `^12.34.3` |
| `@sentry/react` | `^10.47.0` |
| `zod` | `^3.25.76` |
| `recharts` | `^3.8.0` |
| `vite-plugin-pwa` | `^1.2.0` |
| `vitest` | `^4.1.0` |
| `@playwright/test` | `^1.60.0` |

## 2. Scripts npm

| Script | Comando | Para que serve |
|---|---|---|
| `dev` | `vite` | servidor de desenvolvimento (porta 8080) |
| `build` | `vite build` | build de producao |
| `build:dev` | `vite build --mode development` | build com env de desenvolvimento |
| `build:analyze` | `ANALYZE=1 vite build` | build + relatorio de bundle em dist/stats.html |
| `typecheck` | `tsc --build` | checagem de tipos TypeScript |
| `lint` | `eslint .` | ESLint em todo o projeto |
| `preview` | `vite preview` | serve o build local |
| `test` | `vitest run` | testes unitarios (Vitest) |
| `test:watch` | `vitest` | Vitest em watch |
| `e2e` | `playwright test` | testes end-to-end (Playwright) |
| `e2e:ui` | `playwright test --ui` | Playwright em modo UI |
| `e2e:smoke` | `playwright test --config=playwright.audit.config.ts` | smoke tests de auditoria |
| `e2e:seed` | `tsx tests/e2e/helpers/seed-runner.ts seed` | popula dados de teste |
| `e2e:teardown` | `tsx tests/e2e/helpers/seed-runner.ts teardown` | limpa dados de teste |

## 3. Variaveis de ambiente do frontend (arquivo `.env`, prefixo VITE_)

Sao publicas por natureza (vao para o bundle). Nunca colocar chave privada aqui.

| Variavel | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL da API do backend (Lovable Cloud) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | chave publicavel (anon) usada pelo cliente |
| `VITE_SUPABASE_PROJECT_ID` | id do projeto de backend |
| `VITE_POSTHOG_HOST` | referenciada em `src/` (opcional; ausente = feature desligada) |
| `VITE_POSTHOG_KEY` | referenciada em `src/` (opcional; ausente = feature desligada) |
| `VITE_SENTRY_DSN` | referenciada em `src/` (opcional; ausente = feature desligada) |

> `src/integrations/supabase/client.ts` e o `.env` sao gerados automaticamente pela plataforma — nao editar a mao.

## 4. Segredos do backend (edge functions)

Guardados no cofre da plataforma e lidos com `Deno.env.get(...)`. Nunca ficam no codigo nem no `.env`.

| Segredo | Uso |
|---|---|
| `SUPABASE_URL` | injetado automaticamente |
| `SUPABASE_ANON_KEY` | injetado; usado por funcoes chamadas via pg_cron/pg_net |
| `SUPABASE_SERVICE_ROLE_KEY` | injetado; acesso administrativo dentro das functions |
| `LOVABLE_API_KEY` | gerenciado pela plataforma — IA (imagens, extracao de produtos, textos) |
| `STRIPE_SECRET_KEY` | cobranca de assinaturas (`create-checkout`) |
| `STRIPE_WEBHOOK_SECRET` | validacao de assinatura do webhook Stripe |
| `TAXIMACHINE_MESSAGE_API_KEY` | envio de mensagens ao motorista via TaxiMachine |
| `TELEGRAM_API_KEY` | notificacoes internas no Telegram (connector) |
| `FIRECRAWL_API_KEY` | scraping de produtos (connector) |
| `AGENT_SECRET` | autenticacao da `agent-api` / `mcp-server` |

## 5. Build, PWA e cache

- Bundler: **Vite** com `@vitejs/plugin-react-swc`; alias `@` -> `src/`.
- PWA via `vite-plugin-pwa` (somente em build de producao), `registerType: autoUpdate`, `skipWaiting` + `clientsClaim`.
- `cacheId` atual: **vale-resgate-v13** — incrementar sempre que precisar invalidar Service Worker e caches antigos nos clientes.
- Navegacao (HTML) usa **NetworkFirst** (timeout 5s) para nunca servir HTML velho apontando para chunks inexistentes.
- `NetworkOnly` obrigatorio para: `/functions/v1/*`, `rest/v1/driver_import_jobs*`, `storage/v1/object/(sign|upload)*`.
- `navigateFallbackDenylist` cobre rotas publicas (`/p/`, `/loja/`, `/landing`, `/produtos`, `/auth`, `/ofertas`, ...).
- `index.html` traz meta `app-version` (2026-06-13-mega-batch-v13) + guarda de versao que desregistra SW antigo e limpa caches quando a versao muda.
- `src/lib/lazyWithRetry.ts` + `src/lib/pwaRecovery.ts` tratam falha de import dinamico (chunk fantasma).

## 6. Metadados de SEO/PWA

- `<title>`: Vale Resgate — Painel Admin
- `<meta name="description">`: Painel administrativo Vale Resgate — Gerencie vouchers, lojas e clientes
- Manifest: `public/manifest.json` + manifest gerado pelo plugin PWA (nome "Vale Resgate", `display: standalone`, tema `#6d4aff`, fundo `#0f0a2e`).

## 7. Dominios

- Preview: `id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app`
- Publicado: `fidelidadevaleresgate.lovable.app`
- Portal administrativo: `app.valeresgate.com.br` (constante `PORTAL_HOSTNAME`)
- Dominios de marca (white-label): resolvidos na tabela `brand_domains`; prioridade `?brandId=` > hostname > portal > `brand_domains`.

## 8. Qualidade e CI

- `.github/workflows/ci.yml` e `pr-check.yml`: lint, typecheck, testes.
- `scripts/lint-rls-migrations.ts`: valida que migrations novas tragam GRANT/RLS.
- `.gitleaks.toml`: varredura de segredos vazados.
- Testes: Vitest (`src/**/__tests__`), Playwright (`tests/e2e/`), auditorias SQL em `supabase/audit/`.

## 9. Observabilidade

- Sentry (`src/lib/sentry.ts`), Web Vitals (`src/lib/webVitals.ts`), PostHog (`src/lib/analytics.ts`).
- Logs estruturados nas edge functions via `supabase/functions/_shared/edgeLogger.ts`.
- Tabelas `error_logs`, `audit_logs`, `mirror_sync_logs`, `driver_message_logs`.

