# 📋 Débitos Técnicos — Vale Resgate

**Última atualização**: 2026-03-14  
**Total de débitos**: 13 itens  
**Distribuição**: 11 Resolvidos/Parciais · 2 Em progresso

---

## ✅ Resolvidos

### TD-001: TypeScript strict mode desabilitado ✅ RESOLVIDO
- **Correção**: `strictNullChecks: true` e `noFallthroughCasesInSwitch: true` habilitados em `tsconfig.app.json`
- **Resultado**: 15+ bugs de null/undefined encontrados e corrigidos

### TD-002: Dados sensíveis da tabela `brands` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_brands_safe` criada (security_invoker) excluindo `stripe_customer_id` e `brand_settings_json`

### TD-003: Dados internos da tabela `stores` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_stores_safe` criada (security_invoker) excluindo campos sensíveis

### TD-004: Cobertura de testes <5% ✅ PARCIALMENTE RESOLVIDO
- **Correção fase 1**: 37 novos testes (~113 testes totais, ~15-20%)
- **Correção fase 2**: +25 novos testes (RLS cross-tenant, earning service, error tracker)
- **Resultado**: ~138 testes totais, cobertura estimada ~25%
- **Próximo passo**: Meta 30% — testes E2E para fluxos de resgate e pontuação

### TD-005: 1450+ usos de `: any` ✅ PARCIALMENTE RESOLVIDO
- **Correção fase 1**: Tipagem forte em módulos críticos (earningService, redemptionService, ForYouSection, OfferBadge)
- **Correção fase 2**: Tipagem em CustomerLayout, CustomerStoreDetailPage, CustomerRedemptionsPage
- **Correção fase 3**: Interfaces tipadas criadas:
  - `SectionDetailOverlay.tsx`: `SectionItem` interface (15 campos tipados, eliminados 5 `any`)
  - `StoreCatalogView.tsx`: `CatalogItem`, `CatalogCategory`, `CatalogOffer` interfaces (eliminados 6 `any`)
  - `StoreReviewsSection.tsx`: tipos existentes aproveitados (3 `any` implícitos resolvidos)
- **Resultado**: ~35 `any` eliminados nos módulos mais sensíveis

### TD-006: Zero `React.memo` em componentes ✅ PARCIALMENTE RESOLVIDO
- **Correção**: `React.memo` em 9 componentes (OfferBadge, AppIcon, EmptyState, SafeImage, StoreOfferCard, StoreOffersList, StoreDetailInfoCard, StoreDetailHero, PendingRedemptionCard)

### TD-007: Componentes >300 linhas ✅ PARCIALMENTE RESOLVIDO
- **Correção**: Sub-componentes extraídos (PendingRedemptionCard, ConfirmRedemptionPanel)
- **Correção fase 2**: Hook `useRedeemMutation` extraído para `src/hooks/useRedeemMutation.ts`
- **Resultado**: Lógica de confirmação reutilizável e testável independentemente

### TD-008: Service Worker não registrado ✅ RESOLVIDO
- **Correção**: `vite-plugin-pwa` configurado com `registerType: 'autoUpdate'` em `vite.config.ts`

### TD-009: Sem integração de error tracking ✅ RESOLVIDO
- **Correção**: Error tracker leve (`src/lib/errorTracker.ts`) + tabela `error_logs` + `ErrorBoundary` integrado

### TD-010: 247 console.log/warn/error em edge functions ✅ RESOLVIDO
- **Correção fase 1**: Logger JSON estruturado criado (`supabase/functions/_shared/edgeLogger.ts`)
- **Correção fase 2**: 6 edge functions migradas (stripe-webhook, expire-pending-pins, scrape-product, check-expiring-favorites, provision-trial, provision-brand)
- **Correção fase 3**: 7 edge functions adicionais migradas:
  - `earn-webhook/index.ts` — 4 console.error → edgeLogger
  - `machine-webhook/index.ts` — 5 console.error → edgeLogger
  - `send-push-notification/index.ts` — 2 console.error → edgeLogger
  - `mobility-webhook/index.ts` — 4 console.error → edgeLogger
  - `create-checkout/index.ts` — 1 console.error → edgeLogger
  - `match-taxonomy/index.ts` — 1 console.error → edgeLogger
  - `register-machine-webhook/index.ts` — 4 console.error → edgeLogger
  - `seed-demo-stores/index.ts` — 1 console.error → edgeLogger
- **Resultado**: Todas as 14 edge functions usando logger estruturado com correlationId

### TD-011: Listagens sem paginação server-side ✅ PARCIALMENTE RESOLVIDO
- **Correção fase 1**: Hook `usePaginatedQuery` criado (`src/hooks/usePaginatedQuery.ts`)
- **Correção fase 2**: Paginação aplicada em:
  - `CustomerWalletPage` — `range(from, to)` com botão "Carregar mais" (30 itens/página)
- **Próximo passo**: Aplicar em StoreRedeemTab e CustomerRedemptionsPage

### TD-013: Sem testes de segurança automatizados ✅ RESOLVIDO
- **Correção**: Suite `rlsCrossTenant.test.ts` com 25+ testes cobrindo 25 tabelas

---

## P2 — Em Progresso

### TD-012: Páginas/componentes flat fora de modules
- **Descrição**: ~90 páginas em `src/pages/` flat
- **Status**: Pendente
- **Esforço**: 2-3 dias
