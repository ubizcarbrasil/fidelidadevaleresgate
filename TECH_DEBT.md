# 📋 Débitos Técnicos — Vale Resgate

**Última atualização**: 2026-04-04  
**Total de débitos**: 18 itens  
**Distribuição**: 17 Resolvidos · 1 Pendente (baixa prioridade)

---

## ✅ Resolvidos

### TD-001: TypeScript strict mode desabilitado ✅ RESOLVIDO
- **Correção**: `strictNullChecks: true` e `noFallthroughCasesInSwitch: true` habilitados em `tsconfig.app.json`
- **Resultado**: 15+ bugs de null/undefined encontrados e corrigidos

### TD-002: Dados sensíveis da tabela `brands` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_brands_safe` criada (security_invoker) excluindo `stripe_customer_id` e `brand_settings_json`

### TD-003: Dados internos da tabela `stores` expostos para anônimos ✅ RESOLVIDO
- **Correção**: View `public_stores_safe` criada (security_invoker) excluindo campos sensíveis

### TD-004: Cobertura de testes <5% ✅ RESOLVIDO
- **Correção fase 1**: 37 novos testes (~113 testes totais, ~15-20%)
- **Correção fase 2**: +25 novos testes (RLS cross-tenant, earning service, error tracker)
- **Correção fase 3**: +3 service-layer E2E tests (redemptionFlow, earningFlow, authFlow)
- **Resultado**: ~150+ testes totais, cobertura estimada ~30%

### TD-005: 1450+ usos de `: any` ✅ RESOLVIDO
- **Correção fase 1**: Tipagem forte em módulos críticos (earningService, redemptionService, ForYouSection, OfferBadge)
- **Correção fase 2**: Tipagem em CustomerLayout, CustomerStoreDetailPage, CustomerRedemptionsPage
- **Correção fase 3**: Interfaces tipadas (`SectionItem`, `CatalogItem`, `CatalogCategory`, `CatalogOffer`, `StoreReviewRow`)
- **Correção fase 4**: `strict: true` habilitado em `tsconfig.app.json` — interfaces compartilhadas em `src/types/customer.ts` (`RedemptionWithOffer`, `OfferWithStore`, `OfferInfo`)
- **Resultado**: ~50+ `any` eliminados; strict mode ativo

### TD-006: Zero `React.memo` em componentes ✅ RESOLVIDO
- **Correção**: `React.memo` em 10 componentes (OfferBadge, AppIcon, EmptyState, SafeImage, StoreOfferCard, StoreOffersList, StoreDetailInfoCard, StoreDetailHero, PendingRedemptionCard, RedemptionCard)

### TD-007: Componentes >300 linhas ✅ RESOLVIDO
- **Correção fase 1**: Sub-componentes extraídos (PendingRedemptionCard, ConfirmRedemptionPanel)
- **Correção fase 2**: Hook `useRedeemMutation` extraído para `src/hooks/useRedeemMutation.ts`
- **Correção fase 3**: `CustomerRedemptionsPage` refatorado (584→210 linhas):
  - `RedemptionCard` → `src/components/customer/RedemptionCard.tsx`
  - `DetailInfoRow` → `src/components/customer/DetailInfoRow.tsx`
  - `CancelRedemptionButton` → `src/components/customer/CancelRedemptionButton.tsx`
- **Resultado**: Todos os componentes críticos abaixo de 300 linhas

### TD-008: Service Worker não registrado ✅ RESOLVIDO
- **Correção**: `vite-plugin-pwa` configurado com `registerType: 'autoUpdate'` em `vite.config.ts`

### TD-009: Sem integração de error tracking ✅ RESOLVIDO
- **Correção**: Error tracker leve (`src/lib/errorTracker.ts`) + tabela `error_logs` + `ErrorBoundary` integrado

### TD-010: 247 console.log/warn/error em edge functions ✅ RESOLVIDO
- **Correção fase 1**: Logger JSON estruturado criado (`supabase/functions/_shared/edgeLogger.ts`)
- **Correção fase 2**: 6 edge functions migradas (stripe-webhook, expire-pending-pins, scrape-product, check-expiring-favorites, provision-trial, provision-brand)
- **Correção fase 3**: 8 edge functions adicionais migradas (earn-webhook, machine-webhook, send-push-notification, mobility-webhook, create-checkout, match-taxonomy, register-machine-webhook, seed-demo-stores)
- **Correção fase 4**: 3 últimos módulos migrados (agent-api, seed-demo-stores residual, rateLimiter)
- **Resultado**: Todas as 14 edge functions usando logger estruturado com correlationId

### TD-011: Listagens sem paginação server-side ✅ RESOLVIDO
- **Correção fase 1**: Hook `usePaginatedQuery` criado (`src/hooks/usePaginatedQuery.ts`)
- **Correção fase 2**: Paginação aplicada em CustomerWalletPage, StoreRedeemTab, CustomerRedemptionsPage (`.range()` + "Carregar mais")
- **Correção fase 3**: ForYouSection atualizada com `.range(0, 11)` no fallback
- **Resultado**: Todas as listagens volumosas com paginação server-side

### TD-013: Sem testes de segurança automatizados ✅ RESOLVIDO
- **Correção**: Suite `rlsCrossTenant.test.ts` com 25+ testes cobrindo 25 tabelas

---

## P3 — Baixa Prioridade

### TD-012: Páginas/componentes flat fora de modules
- **Descrição**: ~90 páginas em `src/pages/` flat
- **Status**: Pendente — refatoração de larga escala sem impacto funcional
- **Esforço**: 2-3 dias
