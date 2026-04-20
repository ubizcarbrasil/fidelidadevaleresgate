

# Diagnóstico — Lentidão na abertura do app

## O que está pesando hoje (medido no código)

| Gargalo | Onde | Impacto |
|---|---|---|
| **Logo PNG de 43KB** servida na boot screen como `logo-vale-resgate.jpeg` (43KB) e PWA icons sem otimização | `public/logo-vale-resgate.jpeg`, `pwa-192x192.png` | Rede mobile lenta espera o asset |
| **Bundle inicial gigante**: `App.tsx` importa eager 5 providers + 2 lazy do AppLayout, mas o arquivo tem 462 linhas e ~120 imports `lazyWithRetry` declarados no topo | `src/App.tsx` | Parse do JS principal demora |
| **Dashboard dispara 30+ queries simultâneas** no primeiro render (KpiCards, charts, ranking, feed, alerts, tasks, quick links, demo, brand, modules, domains, branches, rides, etc.) | `src/components/dashboard/*` | Aba Dashboard demora 2-4s pra ficar interativa |
| **AppLayout faz 3 `useEffect` com queries Supabase em série** no mount (platform_config, brand settings, bell ring) | `AppLayout.tsx:92-124` | Bloqueia o primeiro paint do shell |
| **BrandContext bloqueia loading por 3-5s** com timer de segurança e duas queries em série (brand → branches+profile) | `BrandContext.tsx:114-188` | "Loading…" branco antes de ver qualquer tela |
| **AuthContext bloqueia loading até buscar roles** (uma query extra) antes de liberar a aplicação | `AuthContext.tsx:52-77` | Splash extra pra usuário logado |
| **Realtime subscription do Dashboard** registra 4 canais Supabase no mount, mesmo antes de o usuário interagir | `Dashboard.tsx:110-128` | Conexão WebSocket competindo com fetch inicial |
| **Sem prefetch** nas rotas mais usadas (Dashboard, Motoristas, Cidades) | App.tsx | Navegação interna sempre baixa chunk |
| **manualChunks do Vite** não separa Recharts (~150KB) que só é usado em Dashboard/Reports | `vite.config.ts` | Recharts entra no chunk principal |

## Plano — 3 frentes, sem mudança funcional

### Frente 1 — Aceleração do shell e providers (boot mais rápido)

**1. AuthContext: liberar `loading=false` antes de roles**
- Trocar `await fetchRoles()` no bootstrap por `void fetchRoles()` (fire-and-forget) — a UI já consegue decidir rota com `user`; roles chegam depois.
- Ganho: -200~500ms no primeiro paint para usuário logado.

**2. BrandContext: paralelizar resolução**
- Hoje: brand → (em outro effect) branches + profile. Vou unificar em um único effect que dispara `fetchBrandById` + `branches` em paralelo via `Promise.all`.
- Reduzir safetyTimeout de 3000ms para 2000ms.
- Ganho: -300~800ms quando há domínio próprio.

**3. AppLayout: agrupar `useEffect`s em um único batch**
- Combinar as 3 chamadas Supabase em uma `Promise.all` única.
- Adiar o `bell-ring` para `requestIdleCallback`.
- Ganho: shell aparece instantaneamente.

### Frente 2 — Dashboard mais leve no primeiro render

**1. Reduzir queries simultâneas no mount do Dashboard**
- Hoje dispara `useDashboardKpis` + 2 charts + `RankingPontuacao` + `PointsFeed` + `TasksSection` + `AchadinhosAlerts` + `PendingReportsSection` + `RidesCounterCard` + `AdminNotificationBell` + 7 queries do `DashboardQuickLinks` — TUDO ao mesmo tempo.
- Estratégia: envolver as seções secundárias (`PointsFeed`, `RankingPontuacao`, `PendingReportsSection`, `AchadinhosAlerts`, `TasksSection`, `ActivityFeed`) em **`Suspense` + lazy loading deferido** que só monta quando o KPI principal terminou de carregar (cascade controlada, não waterfall — mas evita 20 fetches paralelos no primeiro segundo).

**2. Realtime subscription em `requestIdleCallback`**
- Mover o `useRealtimeRefresh` para iniciar 1s após mount, não no instante zero. Realtime não precisa estar ativo enquanto a página ainda está carregando KPIs.

**3. Aumentar `staleTime` das queries de configuração**
- `brand-quick-links`, `brand-modules-quick-links`, `brand-domain-links`, `integrated-branches` mudam raramente. Subir `staleTime` para 5 min (`CACHE.STALE_TIME_MEDIUM`).

**4. Combinar queries de `DashboardQuickLinks` quando possível**
- Hoje são 7 queries separadas. Consolidar `brand` + `brand_modules` + `brand_domains` em uma única query usando join/select aninhado quando o RLS permitir, ou pelo menos disparar via `useQueries` para batching.

### Frente 3 — Bundle e cache

**1. Vite manualChunks: extrair Recharts**
- Adicionar `'vendor-charts': ['recharts']` no `manualChunks`. Recharts não entra no bundle inicial.

**2. Preload do Dashboard chunk no shell**
- Adicionar `<link rel="modulepreload">` para `Dashboard.tsx` no `index.html` (gerado dinamicamente via Vite plugin) — assim o chunk começa a baixar enquanto o React monta o shell.

**3. Otimizar logo do bootstrap**
- O bootstrap overlay no `index.html` já usa SVG inline (rápido). Mas o `apple-touch-icon` aponta para `pwa-192x192.png` (15KB). Trocar por versão WebP otimizada ou marcar como `loading="lazy"` quando aplicável.

**4. Limpar warnings do React Router v6**
- Adicionar `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` no `<BrowserRouter>` para silenciar warnings que aparecem nos logs (custo zero, melhora startup).

## Onde NÃO vou mexer (pra manter risco zero)

- Service Worker / PWA recovery (já estabilizados na rodada anterior)
- Layout responsivo (concluído na fase 2)
- Lógica de duelo / configurações (já validadas)
- RLS, edge functions, banco
- Componentes funcionais (apenas hooks de fetch e ordem de mount)

## Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/contexts/AuthContext.tsx` | Liberar loading antes de roles (fire-and-forget) |
| `src/contexts/BrandContext.tsx` | Paralelizar brand + branches + profile |
| `src/components/AppLayout.tsx` | Agrupar `useEffect`s + adiar bell-ring |
| `src/pages/Dashboard.tsx` | Adiar realtime subscription via `requestIdleCallback` + lazy seções secundárias |
| `src/components/dashboard/DashboardQuickLinks.tsx` | Aumentar staleTime + `useQueries` para batch |
| `src/components/dashboard/DashboardChartsSection.tsx` | staleTime maior pra `integrated-branches` e `top-stores-ranking` |
| `vite.config.ts` | Adicionar `vendor-charts` ao manualChunks |
| `src/App.tsx` | Adicionar `future` flags ao `BrowserRouter` |

## Resultado esperado

- **Boot do shell**: de ~2,5s → ~1,2s no celular médio
- **Dashboard interativo**: de ~3,5s → ~1,8s
- **Navegação interna**: chunks em cache pré-aquecidos
- **Sem flicker de loading** entre Auth/Brand/AppLayout

## Risco e rollback

- **Risco baixo**: nenhuma mudança de lógica de negócio. Só ordem/concorrência de fetches e bundle splitting.
- **Rollback**: reverter os 8 arquivos via histórico.
- **Sem migração SQL, sem edge function nova.**

## Estimativa

~20 min. `npx tsc --noEmit` esperado limpo. Pronto pra publicar logo após.

