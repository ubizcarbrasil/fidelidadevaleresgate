# 📋 Débitos Técnicos — Vale Resgate

**Última atualização**: 2026-03-14  
**Total de débitos**: 13 itens  
**Distribuição**: 2 P1 (resolvidos) · 6 P2 (resolvidos/parciais) · 2 P2 (em progresso) · 3 Resolvidos anteriormente

---

## ✅ Resolvidos

### TD-001: TypeScript strict mode desabilitado ✅ RESOLVIDO
- **Correção**: `strictNullChecks: true` e `noFallthroughCasesInSwitch: true` habilitados em `tsconfig.app.json`
- **Resultado**: 15+ bugs de null/undefined encontrados e corrigidos

### TD-002: Dados sensíveis da tabela `brands` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_brands_safe` criada (security_invoker) excluindo `stripe_customer_id` e `brand_settings_json`

### TD-003: Dados internos da tabela `stores` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_stores_safe` criada (security_invoker) excluindo campos sensíveis

### TD-004: Cobertura de testes <5% ✅ PARCIALMENTE RESOLVIDO → EM PROGRESSO
- **Correção fase 1**: 37 novos testes (~113 testes totais, ~15-20%)
- **Correção fase 2**: +25 novos testes (RLS cross-tenant, earning service, error tracker)
- **Resultado**: ~138 testes totais, cobertura estimada ~25%
- **Próximo passo**: Meta 30% — testes E2E para fluxos de resgate e pontuação

### TD-005: 1450+ usos de `: any` ✅ PARCIALMENTE RESOLVIDO
- **Correção fase 1**: Tipagem forte aplicada em módulos críticos:
  - `earningService.ts`: `e: any` → `e: { points_earned: number }` (2 ocorrências)
  - `redemptionService.ts`: `as any` → `as RedemptionListItem[]` (1 ocorrência)
  - `ForYouSection.tsx`: `useState<any[]>` → `useState<OfferWithStore[]>` + tipagem de scored/map
  - `OfferBadge.tsx`: `Record<string, React.ComponentType<any>>` → `Record<string, LucideIcon>`
- **Correção fase 2**: Tipagem em componentes customer-facing:
  - `CustomerLayout.tsx`: interfaces `SectionDetail`, `SectionItem` criadas
  - `CustomerStoreDetailPage.tsx`: `faqJson as any[]` → `FaqItem[]` com interface tipada
  - `CustomerRedemptionsPage.tsx`: tipagem de contadores e filtros
- **Resultado**: ~20 `any` eliminados nos módulos mais sensíveis
- **Próximo passo**: Continuar nos componentes customer e pages

### TD-006: Zero `React.memo` em componentes ✅ PARCIALMENTE RESOLVIDO
- **Correção**: `React.memo` aplicado em componentes de alta frequência:
  - `OfferBadge` — renderizado em loop nas listas de ofertas
  - `AppIcon` — renderizado dezenas de vezes em listas/grids
  - `EmptyState` — componente estático reutilizado
  - `SafeImage` — renderizado em loop com props estáveis
  - (Anteriores: StoreOfferCard, StoreOffersList, StoreDetailInfoCard, StoreDetailHero, PendingRedemptionCard)
- **Resultado**: 9 componentes memoizados no total

### TD-008: Service Worker não registrado ✅ RESOLVIDO
- **Correção**: `vite-plugin-pwa` configurado com `registerType: 'autoUpdate'` em `vite.config.ts`
- **Resultado**: SW registrado automaticamente com cache de Supabase API e assets

### TD-009: Sem integração de error tracking ✅ RESOLVIDO
- **Correção**: Error tracker leve implementado (`src/lib/errorTracker.ts`)
  - Captura `window.onerror` e `unhandledrejection`
  - `ErrorBoundary` integrado com `componentDidCatch` → `reportError()`
  - Tabela `error_logs` com RLS (insert para todos, select apenas root_admin)
  - Contexto de user_id e brand_id via `setErrorContext()`
  - Inicializado em `src/main.tsx`

### TD-010: 247 console.log/warn/error em edge functions ✅ RESOLVIDO
- **Correção fase 1**: Logger JSON estruturado criado (`supabase/functions/_shared/edgeLogger.ts`)
- **Correção fase 2**: Todas as 6 edge functions migradas para usar `createEdgeLogger`:
  - `stripe-webhook/index.ts` — 5 logs migrados
  - `expire-pending-pins/index.ts` — 2 logs migrados
  - `scrape-product/index.ts` — 4 logs migrados
  - `check-expiring-favorites/index.ts` — 4 logs migrados
  - `provision-trial/index.ts` — 4 logs migrados
  - `provision-brand/index.ts` — 4 logs migrados
- **Resultado**: 23 `console.log/error` substituídos por logger estruturado com correlationId

### TD-013: Sem testes de segurança automatizados ✅ RESOLVIDO
- **Correção**: Suite expandida `rlsCrossTenant.test.ts` com 25+ testes cobrindo:
  - 25 tabelas com brand_id scoping (SELECT cross-tenant retorna vazio)
  - 4 tabelas com INSERT/UPDATE/DELETE cross-brand bloqueados
  - 5 tabelas com user_id scoping (cross-user isolation)
  - Safe views não expõem campos sensíveis
  - audit_logs insert-only para não-root
  - error_logs insert-only para não-root
  - Verificação de ausência de service_role no client

---

## P2 — Em Progresso

### TD-007: Componentes >300 linhas
- **Descrição**: `StoreRedeemTab` (490), `CustomerStoreDetailPage` (347), `StoreCatalogPage` (238)
- **Status**: StoreRedeemTab já possui sub-componentes extraídos (PendingRedemptionCard, ConfirmRedemptionPanel). CustomerStoreDetailPage decomposto em StoreFAQ, StoreOrientations, VideoEmbed, StoreGallery, StoreLocationSection.
- **Próximo passo**: Extrair `useRedeemMutation` hook do StoreRedeemTab
- **Esforço**: 1 dia

### TD-011: Listagens sem paginação server-side
- **Descrição**: Dados truncados sem indicação ao usuário
- **Correção parcial**: Hook `usePaginatedQuery` criado (`src/hooks/usePaginatedQuery.ts`)
- **Próximo passo**: Aplicar em CustomerWalletPage, StoreRedeemTab, CustomerRedemptionsPage
- **Esforço**: 1 dia

### TD-012: Páginas/componentes flat fora de modules
- **Descrição**: ~90 páginas em `src/pages/` flat
- **Status**: Pendente
- **Esforço**: 2-3 dias
