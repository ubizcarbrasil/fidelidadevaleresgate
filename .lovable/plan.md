

# Plano: Remediação Final — 6 Itens Pendentes

Análise do estado atual revela que vários itens já foram parcialmente implementados. Abaixo, o escopo real restante.

---

## 1. Paginação — ForYouSection (único pendente real)

`CustomerWalletPage` e `StoreRedeemTab` **já possuem** paginação com `.range()` e "Carregar mais". O único componente sem paginação é `ForYouSection`, que usa `.limit(8)` no fallback e `p_limit: 12` na RPC.

**Ação:** Adicionar estado de paginação e botão "Ver mais" no `ForYouSection`:
- Trocar `.limit(8)` por `.range(from, to)` com `PAGE_SIZE = 12`
- Adicionar `loadMore` com append de novos itens ao carousel
- Na RPC, manter `p_limit` mas permitir offset via parâmetro adicional ou simplesmente usar o fallback paginado

**Nota prática:** ForYouSection é um carousel horizontal — paginação aqui é menos impactante. A abordagem mais adequada é manter a RPC com limite fixo e apenas paginar o fallback. Implementação leve.

---

## 2. TypeScript `strict: true`

**Ação em `tsconfig.app.json`:** Mudar `"strict": false` → `"strict": true` e remover `"noImplicitAny": false` (redundante com strict).

Isso ativa `noImplicitAny`, `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInErrorType`.

**Erros esperados (~70+ ocorrências de `: any` em `src/pages/customer/`):**
- `CustomerRedemptionsPage.tsx`: `r: any` no `RedemptionCard` → criar interface `RedemptionWithOffer`
- `CustomerRedemptionDetailPage.tsx`: `redemption: any` → reusar `RedemptionWithOffer`
- `CustomerOfferDetailPage.tsx`: `store: any`, `icon: any` → tipar com `Tables<"stores">` e `LucideIcon`
- `CustomerProfilePage.tsx`: `customer: any` → `Tables<"customers">`
- `CustomerOffersPage.tsx`: `o: any` no filter → `OfferWithStore`
- `catch (err: any)` em ~8 arquivos → `catch (err: unknown)` com type guard
- `CancelButton`: `"CANCELED" as any` → cast correto ou union type

**Arquivos afetados:** ~10 em `src/pages/customer/`, ~5 em `src/components/customer/`

---

## 3. Refatoração de Componentes Grandes

| Componente | Linhas | Ação |
|---|---|---|
| `CustomerRedemptionsPage` | 579 | Extrair `RedemptionCard` → `src/components/customer/RedemptionCard.tsx` (~230 linhas), `CancelButton` → separado, `DetailInfoRow` → separado |
| `CustomerStoreDetailPage` | 353 | Já refatorado com sub-componentes inline (`StoreFAQ`, `StoreOrientations`, `VideoEmbed`, `StoreGallery`, `StoreLocationSection`). Extrair para arquivos separados. |
| `StoreCatalogPage` | 238 | Abaixo do limiar, manter. |

---

## 4. Edge Functions → edgeLogger (3 restantes)

Apenas 3 funções ainda usam `console.log/error`:
- `agent-api/index.ts` (1 `console.error`)
- `seed-demo-stores/index.ts` (1 `console.error` residual)
- `_shared/rateLimiter.ts` (1 `console.error`)

**Ação:** Importar `createEdgeLogger` e substituir os 3 restantes.

---

## 5. Testes E2E

Criar testes de integração com Vitest (não Playwright/Cypress, que exigem infraestrutura de CI externa) simulando fluxos críticos:
- `src/modules/loyalty/__tests__/redemptionFlow.test.ts` — fluxo completo de resgate
- `src/modules/loyalty/__tests__/earningFlow.test.ts` — fluxo de acúmulo
- `src/modules/auth/__tests__/authFlow.test.ts` — login/signup

Esses testes validam a lógica de serviço end-to-end (service layer), não UI.

---

## 6. Service Worker — Já Implementado

O `vite-plugin-pwa` já está configurado em `vite.config.ts` com `registerType: 'autoUpdate'`. O SW é registrado automaticamente pelo plugin. **Nenhuma ação necessária.**

---

## 7. Atualizar TECH_DEBT.md

Marcar TD-004, TD-005, TD-007, TD-011, TD-012 com status atualizado.

---

## Resumo de Arquivos (~20)

| Item | Arquivos |
|---|---|
| Paginação | `ForYouSection.tsx` |
| Strict TS | `tsconfig.app.json` + ~15 arquivos customer |
| Refatoração | `CustomerRedemptionsPage` → 3 novos arquivos |
| Edge logs | 3 edge functions |
| Testes | 3 novos arquivos de teste |
| Docs | `TECH_DEBT.md` |

