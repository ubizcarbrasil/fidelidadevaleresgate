

# Plano de Auditoria Enterprise — Vale Resgate

## Visao Geral da Abordagem

A auditoria sera executada em **5 etapas sequenciais**, cada uma gerando achados com status e prioridade. A execucao em etapas garante que nenhuma area fique sem revisao.

---

## ETAPA 1 — Seguranca & RLS (Blockers P0)

### Achados Preliminares da Exploracao

| Item | Status | Prio | Detalhe |
|------|--------|------|---------|
| RLS ativado em todas as tabelas | ⚠️ WARNING | P0 | `rate_limit_entries` tem RLS ativado mas **zero politicas** — acesso bloqueado para todos, pode causar falhas silenciosas em edge functions usando anon key |
| Politicas `true` (USING/WITH CHECK) | ⚠️ WARNING | P1 | 3 tabelas com politicas permissivas: `affiliate_deal_categories` (INSERT/UPDATE/DELETE com `true`), `crm_tiers` SELECT `true`, `roles`/`permissions`/`role_permissions` SELECT `true` |
| Leaked password protection | ⚠️ WARNING | P1 | Desabilitado — usuarios podem usar senhas comprometidas |
| `strict: false` no tsconfig.app.json | ❌ FAIL | P1 | Sem checagem estrita de tipos no codigo principal |
| 1450+ usos de `: any` | ❌ FAIL | P2 | Tipagem fraca espalhada em 109 arquivos |
| Token de sessao passado na URL do iframe CRM | ⚠️ WARNING | P1 | `access_token` exposto como query param — pode vazar em logs de servidor/referrer |
| `dangerouslySetInnerHTML` | ✅ PASS | — | Apenas em `chart.tsx` (componente UI library, nao user-input) |
| Secrets hardcoded | ✅ PASS | — | Nenhum secret no codigo; anon key esta no .env |
| RBAC com security definer functions | ✅ PASS | — | `has_role`, `user_has_permission`, `get_user_*_ids` corretamente isolados |

### Acoes desta Etapa
1. Criar politicas RLS para `rate_limit_entries` (permitir INSERT/SELECT apenas via service_role ou functions)
2. Substituir `true` nas politicas de `affiliate_deal_categories` por checagem de brand scope
3. Remover `access_token` da URL do iframe CRM — usar `postMessage` ou aceitar login separado
4. Habilitar leaked password protection via configuracao de auth

---

## ETAPA 2 — Arquitetura & Qualidade de Codigo

### Achados Preliminares

| Item | Status | Prio | Detalhe |
|------|--------|------|---------|
| Lazy loading de rotas | ✅ PASS | — | Todas as ~90 paginas usam `lazy()` |
| Error Boundary global | ✅ PASS | — | Presente no root do App |
| `React.memo` | ❌ FAIL | P2 | Zero usos em todo o projeto |
| Organizacao feature-based | ⚠️ WARNING | P2 | `src/modules/` existe para auth/crm/vouchers/loyalty/stores/customers, mas muitas pages/components ainda estao flat |
| SRP em componentes | ⚠️ WARNING | P2 | Varios componentes >200 linhas (StoreRedeemTab, CustomerStoreDetailPage, etc.) |
| Hook size | ⚠️ WARNING | P2 | Hooks como `useBrandGuard` estao bem, mas precisaria auditoria de tamanho em todos |
| TypeScript strict | ❌ FAIL | P1 | `strict: false`, `noImplicitAny: false` no tsconfig.app.json |
| Duplicacao de tipos | ⚠️ WARNING | P2 | `UserRole`, `ROLE_LABELS` definidos tanto em `AuthContext.tsx` quanto `modules/auth/types.ts` |

### Acoes desta Etapa
1. Habilitar `strict: true` incrementalmente (fase 1: `strictNullChecks`, fase 2: `noImplicitAny`)
2. Consolidar tipos duplicados em `modules/auth/types.ts` como unica fonte
3. Adicionar `React.memo` nos componentes de listagem pesados
4. Refatorar componentes >300 linhas em sub-componentes

---

## ETAPA 3 — Performance & Escalabilidade

### Achados Preliminares

| Item | Status | Prio | Detalhe |
|------|--------|------|---------|
| Code splitting | ✅ PASS | — | Lazy loading em todas as rotas |
| React Query config | ✅ PASS | — | staleTime 30s, gcTime 10min, retry com backoff |
| Debounce em buscas | ⚠️ WARNING | P2 | `useDebounce` hook existe, verificar se aplicado em todos os inputs de busca |
| Paginacao server-side | ⚠️ WARNING | P2 | Precisa verificar se listagens grandes (stores, offers, customers) usam limit/offset |
| Service Worker / PWA | ⚠️ WARNING | P2 | `manifest.json` existe mas precisa verificar se SW esta registrado |
| Indice DB para queries frequentes | ⚠️ WARNING | P2 | 90+ migrations mas precisa auditar indices em FKs |

### Acoes desta Etapa
1. Auditar todas as listagens para paginacao server-side
2. Verificar indices nas colunas mais consultadas (brand_id, branch_id, store_id, customer_id)
3. Verificar registro de Service Worker

---

## ETAPA 4 — Testes & Observabilidade

### Achados Preliminares

| Item | Status | Prio | Detalhe |
|------|--------|------|---------|
| Unit tests | ❌ FAIL | P1 | Apenas ~5 arquivos de teste (auth, crm, vouchers, loyalty) — cobertura <5% |
| E2E tests | ❌ FAIL | P1 | Nenhum teste Playwright encontrado |
| Logger estruturado | ✅ PASS | — | `src/lib/logger.ts` existe |
| Web Vitals | ✅ PASS | — | `src/lib/webVitals.ts` existe |
| Error tracking (Sentry) | ❌ FAIL | P2 | Nenhuma integracao de error tracking |
| console.log em producao | ⚠️ WARNING | P2 | 66 usos em 8 arquivos (maioria em edge functions) |

### Acoes desta Etapa
1. Criar testes unitarios para services criticos (voucher, earning, redemption)
2. Criar pelo menos 3 testes E2E: login, criar oferta, resgatar cupom
3. Limpar console.logs das edge functions ou substituir por logger
4. Avaliar integracao com Sentry/error tracking

---

## ETAPA 5 — UX, Deploy & Documentacao

### Achados Preliminares

| Item | Status | Prio | Detalhe |
|------|--------|------|---------|
| Loading states | ✅ PASS | — | ProtectedRoute tem spinner, Suspense com PageLoader |
| Toast notifications | ✅ PASS | — | Sonner integrado em todas as operacoes |
| Migrations versionadas | ✅ PASS | — | 90+ migrations sequenciais |
| README atualizado | ⚠️ WARNING | P2 | Precisa verificar conteudo |
| AUDIT_REPORT.md | ❌ FAIL | P2 | Nao existe — sera gerado |

### Acoes desta Etapa
1. Gerar `AUDIT_REPORT.md` com score consolidado
2. Gerar `TECH_DEBT.md` com lista priorizada
3. Gerar `REMEDIATION_PLAN.md` com fases
4. Gerar `ARCHITECTURE_DECISION_RECORD.md`

---

## Sequencia de Execucao

```text
Etapa 1 (Seguranca/RLS)     ████████░░  ~40min  [BLOCKER]
Etapa 2 (Arquitetura)       ██████░░░░  ~30min
Etapa 3 (Performance)       ████░░░░░░  ~20min
Etapa 4 (Testes)            ██████░░░░  ~30min
Etapa 5 (Docs/Entregaveis)  ████░░░░░░  ~20min
```

### Score Preliminar Estimado

| Categoria | Score |
|-----------|-------|
| Seguranca | 72% ⚠️ |
| Arquitetura | 65% ⚠️ |
| Performance | 78% |
| Testes | 15% ❌ |
| UX | 85% |
| **Geral** | **~63%** |

**Veredicto preliminar**: Projeto **NAO aprovado** para producao enterprise. 3 itens P0 precisam correcao antes do deploy (RLS gaps, token na URL, politicas permissivas).

Deseja aprovar este plano para execucao etapa por etapa?

