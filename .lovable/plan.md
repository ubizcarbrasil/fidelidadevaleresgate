

# Plano: Remediação de Dívida Técnica (P1 + P2)

Este é um plano abrangente cobrindo os 8 itens solicitados. Dado o volume, a implementação será dividida em **duas fases** dentro desta sessão — priorizando os itens P1 primeiro.

---

## Fase 1 — P1 (Imediato)

### 1. Testes Automatizados de RLS Cross-Tenant

Os testes existentes em `rlsPenetration.test.ts` usam mocks que **não validam RLS real** (sempre retornam `[]`). Vou criar uma suite que testa via edge function com service role vs anon key.

**Abordagem:**
- Nova edge function `rls-test` (só acessível em dev) que executa queries cross-tenant com service role e anon key, comparando resultados
- Novos testes unitários mais robustos que validam:
  - Tabelas sensíveis com `brand_id` scoping (stores, offers, vouchers, customers, redemptions, earning_events, points_ledger)
  - Tentativa de INSERT/UPDATE/DELETE cross-brand
  - Views seguras (`public_brands_safe`, `public_stores_safe`) não expõem campos sensíveis
  - `audit_logs` são insert-only para não-root

**Arquivos:**
- `src/lib/__tests__/rlsCrossTenant.test.ts` — nova suite expandida
- `supabase/functions/rls-test/index.ts` — edge function para testes de integração real

### 2. Rastreamento de Erros (Sentry-like)

Sentry requer DSN externo e SDK pesado. Alternativa: implementar um **error tracker leve integrado ao sistema existente** usando `ErrorBoundary` + `logger.ts` + edge function para persistir erros.

**Abordagem:**
- Criar `src/lib/errorTracker.ts` — módulo que captura `window.onerror`, `unhandledrejection`, e erros do ErrorBoundary
- Persiste erros na tabela `error_logs` (nova) com: message, stack, user_id, brand_id, url, timestamp, metadata
- Inicializar em `src/main.tsx`
- Enriquecer `ErrorBoundary` para reportar erros automaticamente
- Tabela com RLS: root_admin pode ler tudo, outros podem inserir

**Arquivos:**
- `src/lib/errorTracker.ts` — novo
- `src/main.tsx` — adicionar inicialização
- `src/components/ErrorBoundary.tsx` — integrar report
- Migração SQL: tabela `error_logs`

### 3. Reduzir `: any` em Módulos Críticos

Foco nos módulos `loyalty`, `crm`, `vouchers`, `customers` e componentes customer-facing.

**Arquivos prioritários e correções:**
- `earningService.ts` (linhas 83, 88): `e: any` → `e: { points_earned: number }`; `as any` nas inserts → usar tipos do Supabase `Tables<"earning_events">` insert type
- `redemptionService.ts` (linha 46): `as any` → tipo correto `RedemptionListItem[]`
- `CustomerLayout.tsx` (~12 `any`): criar interfaces `Offer`, `Store`, `SectionDetail`
- `ForYouSection.tsx`: `useState<any[]>` → `useState<Tables<"offers">[]>`
- `SectionDetailOverlay.tsx`: tipar `items` com union type
- `StoreCatalogView.tsx`: tipar `addToCart` item
- `StoreReviewsSection.tsx`: tipar resultados de query

**Meta**: eliminar ~40-50 `any` nos módulos mais críticos.

### 4. `React.memo` em Componentes Críticos

Já existem 4 componentes com `React.memo` (StoreOfferCard, StoreOffersList, StoreDetailInfoCard, StoreDetailHero, PendingRedemptionCard). Expandir para:

**Componentes a memoizar:**
- `OfferBadge` — renderizado em loop dentro de listas de ofertas
- `AppIcon` — renderizado dezenas de vezes em listas
- `EmptyState` — componente estático
- `SafeImage` — renderizado em loop, props estáveis
- `SegmentNavSection` — items estáticos por sessão
- `AchadinhoSection` / `EmissorasSection` — seções da home

**Hooks auxiliares**: adicionar `useCallback` em handlers passados como props em `CustomerLayout.tsx` (já parcialmente feito).

---

## Fase 2 — P2 (Curto Prazo)

### 5. Refatorar Componentes Grandes

| Componente | Linhas | Ação |
|------------|--------|------|
| `StoreRedeemTab` | 490 | Extrair `RedeemPinInput`, `RedemptionHistory`, `useRedeemMutation` hook |
| `CustomerStoreDetailPage` | 347 | Extrair `StoreDetailTabs`, `useStoreDetail` hook |
| `StoreCatalogPage` | 238 | Extrair `CatalogForm`, `CatalogTable` |

### 6. Paginação Server-Side

**Componentes afetados:**
- `CustomerWalletPage` — adicionar `usePaginatedQuery` com offset/limit e botão "Carregar mais"
- `StoreRedeemTab` — cursor-based pagination no histórico
- `ForYouSection` — manter limit(12) mas adicionar "Ver todas" que abre overlay paginado

**Implementar hook reutilizável:** `usePaginatedQuery(table, filters, pageSize)` que gerencia offset, hasMore, loading states.

### 7. Logs Estruturados em Edge Functions

Criar `supabase/functions/_shared/edgeLogger.ts`:
```typescript
interface EdgeLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  module: string;
  correlationId: string;
  message: string;
  data?: unknown;
}
```
Substituir `console.log` por `edgeLog.info()` nas 6 edge functions afetadas (~55 ocorrências).

### 8. Aumentar Cobertura de Testes

Novos testes prioritários:
- `earningService` — calcular pontos, limites diários, duplicidade de recibo
- `redemptionService` — paginação, filtros
- `customerService` — CRUD, validações
- `ErrorBoundary` — render de fallback
- `AuthContext` — role checking

**Meta**: +20-30 testes, elevando cobertura de ~15% para ~25%.

---

## Atualização do TECH_DEBT.md

Após implementação, atualizar status de cada item:
- TD-013 → Resolvido (testes RLS)
- TD-009 → Resolvido (error tracker)
- TD-005 → Parcialmente resolvido (redução em módulos críticos)
- TD-006 → Parcialmente resolvido (memo em componentes de lista)
- TD-007, TD-011, TD-010, TD-004 → Em progresso

---

## Resumo de Arquivos Afetados

| # | Tipo | Arquivos |
|---|------|----------|
| 1 | Novo | `rlsCrossTenant.test.ts`, `rls-test/index.ts` |
| 2 | Novo + Edit | `errorTracker.ts`, `error_logs` migration, `main.tsx`, `ErrorBoundary.tsx` |
| 3 | Edit | ~8 arquivos em modules/ e components/customer/ |
| 4 | Edit | ~6 componentes customer |
| 5 | Novo + Edit | Sub-componentes + hooks extraídos |
| 6 | Novo + Edit | `usePaginatedQuery.ts` + 3 componentes |
| 7 | Novo + Edit | `edgeLogger.ts` + 6 edge functions |
| 8 | Novo | ~5 arquivos de teste |

**Total estimado**: ~25 arquivos novos/modificados, 1 migração SQL.

