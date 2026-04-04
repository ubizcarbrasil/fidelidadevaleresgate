# 📐 Registro de Decisões Arquiteturais (ADR) — Vale Resgate

**Última atualização**: 2026-03-13

---

## ADR-001: React + Vite + Tailwind CSS (Frontend Stack)

- **Status**: Aceita (permanente)
- **Contexto**: Plataforma SaaS multi-tenant com ~90 páginas e ~200 componentes
- **Decisão**: SPA com React 18, Vite (bundler), Tailwind CSS (design system), TypeScript
- **Alternativas consideradas**: Next.js (SSR), Angular, Vue, Svelte
- **Motivo**: Constraint da plataforma Lovable; Vite oferece HMR <100ms; Tailwind acelera iteração de UI
- **Trade-offs aceitos**: Sem SSR/SSG (impacto em SEO de landing pages); sem server components
- **Revisitar quando**: Necessidade de SEO para landing pages públicas ou streaming SSR

---

## ADR-002: Supabase/Lovable Cloud como Backend

- **Status**: Aceita (permanente)
- **Contexto**: Necessidade de auth, database, storage, e serverless functions
- **Decisão**: Supabase (PostgreSQL + Auth + Storage + Edge Functions em Deno)
- **Alternativas consideradas**: Firebase, AWS Amplify, backend Node.js customizado
- **Motivo**: Integração nativa com Lovable; RLS poderoso para multi-tenancy; Edge Functions sem infra
- **Trade-offs aceitos**: Limitado a PostgreSQL; sem backend Node.js; Edge Functions em Deno (não Node)
- **Revisitar quando**: Necessidade de processamento complexo server-side (ML, filas longas)

---

## ADR-003: RBAC com Security Definer Functions

- **Status**: Aceita (madura)
- **Contexto**: 8 roles (root_admin → customer) com isolamento por tenant/brand/branch
- **Decisão**: Papéis em tabela `user_roles` + funções `has_role()`, `user_has_permission()`, `get_user_*_ids()` como `SECURITY DEFINER`
- **Alternativas consideradas**: RLS recursivo direto na tabela; middleware de aplicação; Supabase custom claims
- **Motivo**: Evita recursão infinita em RLS; testável isoladamente; performance previsível
- **Trade-offs aceitos**: Funções DB precisam ser mantidas manualmente; não suporta claims dinâmicos no JWT
- **Revisitar quando**: Supabase adicionar suporte nativo a RBAC no JWT ou custom claims

---

## ADR-004: Multi-tenancy com brand_id/branch_id

- **Status**: Aceita (core)
- **Contexto**: Múltiplas marcas (brands) com múltiplas filiais (branches) por marca
- **Decisão**: Todas as tabelas de dados incluem `brand_id` (e `branch_id` quando aplicável); isolamento via RLS
- **Alternativas consideradas**: Schema por tenant; banco separado por marca; row-level com tenant_id
- **Motivo**: Simplicidade operacional; escala via índices; deploy único para todos os tenants
- **Trade-offs aceitos**: Queries sempre filtram por brand_id; risco de vazamento se RLS falhar; uma falha de infra afeta todos
- **Revisitar quando**: >1000 brands, necessidade de compliance LGPD separada, ou SLA diferenciado por marca

---

## ADR-005: CRM Externo via Iframe (Lince CRM)

- **Status**: Aceita (transitória)
- **Contexto**: Necessidade de CRM estratégico sem equipe para construir nativamente
- **Decisão**: Integrar Lince CRM via iframe com passagem de contexto (brandId, branchId, email) por query params
- **Alternativas consideradas**: CRM nativo embutido; API-only integration; comprar SaaS CRM (HubSpot)
- **Motivo**: Velocidade de entrega; CRM é produto separado com equipe dedicada; funciona como MVP
- **Trade-offs aceitos**: UX de iframe (loading, fallback quando bloqueado); sem deep integration; login potencialmente separado
- **Decisão de segurança**: Token de sessão (`access_token`) **removido** da URL após auditoria — risco de vazamento em logs/referrer
- **Revisitar quando**: CRM nativo for viável ou necessidade de deep integration (dashboards unificados)

---

## ADR-006: Rate Limiting via Banco de Dados

- **Status**: Aceita (pragmática)
- **Contexto**: Proteger edge functions contra abuso sem dependência externa
- **Decisão**: Tabela `rate_limit_entries` com sliding window; cleanup probabilístico (1% chance por request)
- **Alternativas consideradas**: Redis (Upstash); Cloudflare rate limiting; Deno KV
- **Motivo**: Zero dependência externa; funciona com Supabase Edge Functions; implementação simples
- **Trade-offs aceitos**: Mais lento que Redis (~5ms vs <1ms); requer cleanup; window truncada (não sliding real)
- **Limites atuais**: agent-api: 100/60s, earn-webhook: 30/60s, mobility-webhook: 30/60s
- **Revisitar quando**: Volume >10k req/min ou latência do rate limiter >50ms

---

## ADR-007: Lazy Loading Universal de Rotas

- **Status**: Aceita (permanente)
- **Contexto**: ~90 páginas; bundle total estimado >2MB sem splitting
- **Decisão**: `React.lazy()` + `Suspense` para todas as páginas; eager load apenas `App.tsx`, `AuthContext`, `ErrorBoundary`
- **Alternativas consideradas**: Eager load de rotas "quentes" (dashboard, auth); route-based prefetching
- **Motivo**: Bundle inicial <200KB; ~90 páginas tornam eager loading inviável; UX aceitável com spinner
- **Trade-offs aceitos**: Flash de loading na primeira navegação; waterfall se nested lazy
- **Revisitar quando**: Nunca — decisão permanente para esta escala

---

## ADR-008: Event Bus para Comunicação Cross-Module

- **Status**: Aceita (experimental)
- **Contexto**: Módulos precisam reagir a eventos de outros módulos (ex: CUSTOMER_CREATED → invalidar queries CRM)
- **Decisão**: Event bus tipado (`src/lib/eventBus.ts`) com bridge para React Query (`eventBusQueryBridge.ts`)
- **Alternativas consideradas**: Props drilling; Context API; Zustand/Redux global store
- **Motivo**: Desacoplamento entre módulos; extensível; testável isoladamente
- **Trade-offs aceitos**: Debugging mais difícil (eventos assíncronos); sem garantia de ordem
- **Revisitar quando**: Complexidade de eventos exceder 20 tipos ou necessidade de persistência

---

## ADR-009: Ganha-Ganha como Modelo de Monetização

- **Status**: Aceita (business core)
- **Contexto**: Plataforma precisa de modelo de receita recorrente baseado em uso
- **Decisão**: Sistema de billing onde emissoras pagam taxas por pontos/moeda distribuídos; configuração por brand via `ganha_ganha_config`
- **Alternativas consideradas**: SaaS puro (mensalidade fixa); freemium; marketplace commission
- **Motivo**: Alinha incentivos (mais uso = mais receita); escalável; transparente para lojistas
- **Trade-offs aceitos**: Complexidade de billing; necessidade de relatórios de fechamento
- **Revisitar quando**: Churn alto por custo variável ou necessidade de pricing mais simples

---

## ADR-010: React.memo para Componentes de Lista

- **Status**: Aceita (implementada)
- **Contexto**: Listas com 40+ itens (stores, offers, redemptions) causam re-renders desnecessários
- **Decisão**: `React.memo` em card components renderizados dentro de listas (StoreOfferCard, PendingRedemptionCard, StoreDetailHero, StoreDetailInfoCard)
- **Alternativas consideradas**: useMemo em arrays; virtualization (react-window); nenhuma otimização
- **Motivo**: Menor invasividade; previne re-render de cards cujas props não mudaram; combinável com virtualização futura
- **Trade-offs aceitos**: Custo de shallow comparison em cada render; não resolve listas >500 itens (precisa virtualization)
- **Revisitar quando**: Listas >200 itens ou necessidade de scroll infinito com 1000+ registros

---

## ADR-011: Decomposição de Componentes >300 Linhas

- **Status**: Aceita (em progresso)
- **Contexto**: `CustomerStoreDetailPage` (754 linhas) e `StoreRedeemTab` (490 linhas) dificultavam manutenção
- **Decisão**: Extrair seções visuais em sub-componentes (StoreDetailHero, StoreDetailInfoCard, StoreOffersList) com interfaces claras via Props
- **Alternativas consideradas**: Custom hooks para lógica; render props; manter monolítico
- **Motivo**: Componentes <200 linhas são mais fáceis de revisar; sub-componentes reutilizáveis; memoizáveis individualmente
- **Trade-offs aceitos**: Mais arquivos no projeto; prop drilling entre pai e filhos
- **Revisitar quando**: Necessidade de state management compartilhado entre sub-componentes (considerar context local)

---

## ADR-012: TypeScript strictNullChecks Habilitado

- **Status**: Aceita (permanente)
- **Contexto**: `strict: false` permitia bugs de null/undefined silenciosos em produção
- **Decisão**: Fase 1 — habilitar `strictNullChecks: true` e `noFallthroughCasesInSwitch: true` no tsconfig.app.json
- **Alternativas consideradas**: strict: true completo de uma vez; manter desabilitado
- **Motivo**: Incremental — corrigir null-safety sem quebrar 1450+ usos de `any`; 15+ bugs reais encontrados e corrigidos
- **Trade-offs aceitos**: `noImplicitAny` ainda desabilitado (Fase 2); algumas asserções `!` usadas temporariamente
- **Revisitar quando**: Fase 2 — habilitar `noImplicitAny` após resolver maioria dos `: any`

---

## ADR-013: Constantes centralizadas em src/config/constants.ts

- **Data**: 2026-04-04
- **Status**: Aceita
- **Contexto**: Valores como staleTime, gcTime e page sizes estavam hardcoded em dezenas de arquivos.
- **Decisão**: Criar `src/config/constants.ts` com namespaces PAGINATION, CACHE, TIMEOUTS e LIMITS.
- **Alternativas consideradas**: Variáveis de ambiente; configuração em runtime
- **Motivo**: Alterações de configuração ficam em um único ponto; tipagem forte com `as const`.
- **Trade-offs aceitos**: Migração incremental — nem todos os valores hardcoded foram substituídos ainda.
- **Revisitar quando**: Necessidade de configuração por ambiente ou por tenant

---

## ADR-014: CI/CD com GitHub Actions

- **Data**: 2026-04-04
- **Status**: Aceita
- **Contexto**: Não havia validação automática a cada push/PR.
- **Decisão**: Criar `.github/workflows/ci.yml` (tsc + lint + test + build) e `pr-check.yml` (tsc + test).
- **Alternativas consideradas**: GitLab CI; CircleCI; sem CI
- **Motivo**: GitHub Actions integrado nativamente com o repositório; zero custo para repos open source.
- **Trade-offs aceitos**: Depende de npm ci (lento ~60s); sem cache de build.
- **Revisitar quando**: Build time exceder 5 minutos
