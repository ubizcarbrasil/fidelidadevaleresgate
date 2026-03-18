

## Diagnóstico

Investiguei o banco de dados e confirmei que existem ofertas criadas (4 ofertas para sua marca). As políticas de acesso (RLS) e permissões estão corretas — o brand_admin tem `offers.read`.

O painel do lojista (`StoreCouponsTab`) já lista ofertas filtradas por `store_id`, então ofertas criadas pelo lojista já aparecem lá.

O painel do empreendedor (`OffersPage`) também consulta ofertas filtradas por `brand_id`. Se está mostrando 0, o problema pode ser que o contexto da marca não está carregado no momento da consulta.

### Problemas identificados

1. **OffersPage**: A query depende de `currentBrandId` do `useBrandGuard`. Se o `BrandContext` não estiver carregado, `currentBrandId` pode ser `null`, e a query roda sem filtro de marca — o que funciona com RLS, mas pode haver um timing issue. Vou adicionar `enabled: !!currentBrandId` para garantir que a query só roda quando o contexto está pronto.

2. **StoreCouponsTab**: Já mostra as ofertas da loja, mas não atualiza automaticamente após criar uma nova oferta (usa `useEffect` com `store.id` como dependência, sem invalidação). Vou converter para `useQuery` com invalidação automática.

3. **StoreOwnerDashboard**: Os KPIs de "Emitidos/Ativos" já contam ofertas, mas não há lista visual das ofertas recentes no dashboard. Vou adicionar uma seção "Últimas ofertas criadas" no dashboard.

## Plano

### 1. Corrigir OffersPage — garantir query com brandId
**Arquivo:** `src/pages/OffersPage.tsx`
- Adicionar `enabled: !!currentBrandId || isRootAdmin` na query para evitar consultas com brandId vazio
- Forçar invalidação ao criar/editar ofertas

### 2. Melhorar StoreCouponsTab — invalidação automática
**Arquivo:** `src/pages/StoreOwnerPanel.tsx`
- Converter o `useEffect` + `useState` da `StoreCouponsTab` para `useQuery` com queryKey `["store-offers", store.id]`
- Após criar/editar oferta no `StoreVoucherWizard`, invalidar essa queryKey

### 3. Adicionar lista de ofertas recentes no Dashboard do lojista
**Arquivo:** `src/pages/StoreOwnerPanel.tsx`
- No `StoreOwnerDashboard`, após os KPIs, mostrar as 3 ofertas mais recentes com título, status e data
- Cada item clicável para ir à aba "Cupons"

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/OffersPage.tsx` | Adicionar `enabled` guard na query |
| `src/pages/StoreOwnerPanel.tsx` | Converter StoreCouponsTab para useQuery; adicionar ofertas recentes no dashboard |

