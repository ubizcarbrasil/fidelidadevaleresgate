

## Auditoria do Motor de Renderização (HomeSectionsRenderer)

### O que está funcionando corretamente

- **`icon_size`**: O helper `getCardSizes()` mapeia corretamente "small", "medium" e "large" para dimensões diferentes em `OffersCarousel`, `OffersGrid`, `StoresGrid` e `HighlightsWeekly`.
- **`rows_count`**: Quando `rowsCount > 1`, todos os componentes acima alternam para CSS Grid com `grid-template-rows` + `grid-auto-flow: column`, criando o carrossel multi-linha.
- **`filter_mode`**, **`segment_filter_ids`**, **`coupon_type_filter`**, **`city_filter_json`**, **`min_stores_visible`**: Todos lidos e aplicados corretamente no `SectionBlock`.
- **Sponsored boost e ranking boost**: Funcionam corretamente.
- **Valores em "pts"**: `OffersCarousel`, `OffersGrid` e `HighlightsWeekly` já usam `pts`.

### Problemas encontrados

**1. "R$" remanescente no motor (linha 844)**
`StoresList` ainda mostra `Até {b.points_per_real}x pontos/R$`. Deve ser `Até {b.points_per_real}x pontos`.

**2. Template `GRID_LOGOS` sem renderer**
O tipo `GRID_LOGOS` é inferido como source `STORES` (linha 304), os dados são buscados, mas na renderização (linhas 476-490) não existe case para `GRID_LOGOS` — cai no `null`. Precisa de um fallback para `StoresGrid`.

**3. "R$" em ~6 outros arquivos do app do cliente**
Fora do motor principal, ainda existem ~70 referências a `R$` em:
- `ForYouSection.tsx` (value_rescue)
- `EmissorasSection.tsx` (pontos/R$)
- `CustomerSearchOverlay.tsx` (value_rescue)
- `CustomerProfilePage.tsx` (value_rescue)
- `CustomerOffersPage.tsx` (min_purchase)
- `CustomerOfferDetailPage.tsx` (preço produto, crédito, compra mínima)
- `StoreCatalogView.tsx` e `CatalogCartDrawer.tsx` (preços de catálogo — estes são preços reais em dinheiro, R$ é correto aqui)
- `CustomerLedgerOverlay.tsx` (purchase_value, credit_value — valores monetários, R$ pode ser correto)

### Plano de Correção

1. **Linha 844 do HomeSectionsRenderer**: Remover "/R$" → `Até {b.points_per_real}x pontos`
2. **Adicionar `GRID_LOGOS` ao switch de renderização**: Reutilizar `StoresGrid` como fallback
3. **Corrigir "R$" nos arquivos onde representa pontos** (ForYouSection, EmissorasSection, CustomerSearchOverlay, CustomerProfilePage, CustomerOffersPage) — substituir por `pts`
4. **Manter "R$" onde são preços reais**: StoreCatalogView, CatalogCartDrawer, CustomerLedgerOverlay (compras em dinheiro)
5. **CustomerOfferDetailPage**: Alguns R$ são preços de produtos (manter), outros são value_rescue em pontos (corrigir)

