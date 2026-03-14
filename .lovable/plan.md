

# Plano: Remediação Restante — Itens P2 Pendentes

Com base na análise do `TECH_DEBT.md` e do código atual, restam **5 itens concretos** ainda não implementados ou apenas parcialmente feitos.

---

## 1. Migrar Edge Functions para `edgeLogger` (TD-010)

O logger estruturado já existe em `_shared/edgeLogger.ts`, mas **6 edge functions** ainda usam `console.log` (55 ocorrências).

**Arquivos a editar:**
- `supabase/functions/stripe-webhook/index.ts` (5 logs)
- `supabase/functions/expire-pending-pins/index.ts` (1 log)
- `supabase/functions/scrape-product/index.ts` (2 logs)
- `supabase/functions/check-expiring-favorites/index.ts` (1 log)
- `supabase/functions/provision-trial/index.ts` (2 logs)
- `supabase/functions/provision-brand/index.ts` (2 logs)

**Ação:** Importar `createEdgeLogger` e substituir cada `console.log`/`console.error` por chamadas tipadas (`log.info`, `log.error`).

---

## 2. Eliminar `: any` nos componentes customer (TD-005 continuação)

Ainda restam **~170 ocorrências** de `: any` em `src/components/customer/` e `src/pages/customer/`. Focar nos mais críticos:

| Arquivo | Qtd | Correção |
|---------|-----|----------|
| `CustomerLayout.tsx` | ~12 | Criar interfaces `OfferNav`, `StoreNav`, `SectionNav` |
| `CustomerRedemptionsPage.tsx` | ~10 | Tipar `RedemptionCard` props com `Tables<"redemptions">` |
| `CustomerOfferDetailPage.tsx` | ~8 | Tipar `offer`, `store`, `icon` com tipos existentes |
| `CustomerStoreDetailPage.tsx` | ~4 | `faqJson as any[]` → `Array<{question:string;answer:string}>` |
| `SectionDetailOverlay.tsx` | ~4 | Criar union type `SectionItem` |
| `StoreCatalogView.tsx` | ~4 | Tipar `addToCart` item com `Tables<"catalog_items">` |
| `StoreReviewsSection.tsx` | ~3 | Tipar resultado da query |

**Meta**: eliminar ~45 `any` adicionais.

---

## 3. Refatorar Componentes Grandes (TD-007)

### StoreRedeemTab (490 linhas)
- Extrair `RedeemPinInput` (input + validação PIN)
- Extrair `RedemptionHistoryList` (lista de resgates)
- Extrair `useRedeemMutation` hook (lógica de resgate)

### CustomerStoreDetailPage (347 linhas)
- Extrair `StoreDetailFAQ` (accordion FAQ)
- Extrair `useStoreDetail` hook (fetch store + offers + reviews)

### StoreCatalogPage (238 linhas)
- Manter — já está abaixo do limiar crítico; apenas extrair `CatalogItemForm` se ultrapassar 300.

---

## 4. Aplicar `usePaginatedQuery` nas Listagens (TD-011)

O hook já existe. Aplicar em:
- `CustomerWalletPage` — substituir query com `.limit()` por `usePaginatedQuery` + botão "Carregar mais"
- `StoreRedeemTab` — paginar histórico de resgates
- `CustomerRedemptionsPage` — paginar lista de resgates do cliente

---

## 5. Registrar Service Worker (TD-008)

- Adicionar `vite-plugin-pwa` ao `vite.config.ts`
- Configurar `registerType: 'autoUpdate'` com manifest existente
- Registrar SW em `src/main.tsx`

---

## Atualizar TECH_DEBT.md

Marcar TD-010, TD-005, TD-007, TD-011, TD-008 com status atualizado após implementação.

---

## Arquivos Afetados (~20)

| Item | Arquivos |
|------|----------|
| Edge logs | 6 edge functions |
| Any removal | ~7 componentes/pages customer |
| Refactor | StoreRedeemTab → 3 novos arquivos + hook |
| Pagination | 3 pages |
| PWA | `vite.config.ts`, `src/main.tsx` |
| Docs | `TECH_DEBT.md` |

