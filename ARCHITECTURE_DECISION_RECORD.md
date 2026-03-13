# 📐 Decisões Arquiteturais — Vale Resgate

## ADR-001: React + Vite + Tailwind (Frontend)

- **Decisão**: SPA com React, Vite, Tailwind CSS, TypeScript
- **Alternativas**: Next.js (SSR), Angular, Vue
- **Motivo**: Lovable platform constraint; Vite oferece HMR rápido; Tailwind acelera UI
- **Trade-off**: Sem SSR/SSG (impacto em SEO para páginas públicas)
- **Revisitar quando**: Necessidade de SEO para landing pages públicas

## ADR-002: Supabase como Backend (Lovable Cloud)

- **Decisão**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Alternativas**: Firebase, AWS Amplify, backend custom
- **Motivo**: Integração nativa com Lovable; RLS poderoso; Edge Functions em Deno
- **Trade-off**: Limitado a PostgreSQL; sem backend Node.js customizado
- **Revisitar quando**: Necessidade de processamento complexo server-side

## ADR-003: RBAC com Security Definer Functions

- **Decisão**: Papéis em `user_roles` + funções `has_role()`, `user_has_permission()` como security definer
- **Alternativas**: RLS recursivo direto; middleware de aplicação
- **Motivo**: Evita recursão infinita em RLS; testável isoladamente; performance
- **Trade-off**: Funções precisam ser mantidas manualmente
- **Revisitar quando**: Supabase adicionar suporte nativo a RBAC

## ADR-004: Multi-tenant com brand_id/branch_id

- **Decisão**: Isolamento por `brand_id` em todas as tabelas; escopo via RLS
- **Alternativas**: Schema por tenant; banco separado
- **Motivo**: Simplicidade operacional; escala horizontal via índices
- **Trade-off**: Queries sempre precisam filtrar por brand_id; risco de vazamento se RLS falhar
- **Revisitar quando**: >1000 brands ou necessidade de compliance LGPD separada

## ADR-005: CRM via iframe externo (Lince CRM)

- **Decisão**: Integrar CRM externo via iframe com passagem de contexto por query params
- **Alternativas**: CRM embutido nativo; API-only integration
- **Motivo**: Velocidade de entrega; CRM é produto separado com equipe própria
- **Trade-off**: UX de iframe (loading, fallback quando bloqueado); token removido da URL por segurança
- **Revisitar quando**: CRM nativo for viável ou necessidade de deep integration

## ADR-006: Rate Limiting via banco de dados

- **Decisão**: Tabela `rate_limit_entries` com janela deslizante
- **Alternativas**: Redis; Cloudflare rate limiting; Deno KV
- **Motivo**: Sem dependência externa; funciona com Supabase Edge Functions
- **Trade-off**: Mais lento que Redis; requer cleanup periódico
- **Revisitar quando**: Volume >10k req/min ou necessidade de latência <5ms

## ADR-007: Lazy Loading de todas as rotas

- **Decisão**: `React.lazy()` + `Suspense` para todas as ~90 páginas
- **Alternativas**: Eager loading de rotas críticas
- **Motivo**: Bundle inicial menor; ~90 páginas tornam eager loading inviável
- **Trade-off**: Flash de loading na primeira navegação
- **Revisitar quando**: Nunca (decisão permanente para esta escala)
