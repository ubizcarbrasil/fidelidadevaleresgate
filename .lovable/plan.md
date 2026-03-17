

## Continuar correção dark mode — 7 arquivos restantes

Substituir todos os padrões `${primary}XX` e `${fg}XX` por `brandAlpha()` nos arquivos que ainda não foram corrigidos.

### Arquivos e alterações

| Arquivo | Ocorrências |
|---------|-------------|
| `src/pages/customer/CustomerOfferDetailPage.tsx` | ~30 — banners, fallbacks, borders, RuleRow, TermsRuleItem, CPF step |
| `src/pages/customer/CustomerStoreDetailPage.tsx` | ~12 — category badge, orientações, FAQ, localização |
| `src/pages/customer/CustomerRedemptionDetailPage.tsx` | ~18 — PIN section, RuleRow, DetailRow, cancel buttons |
| `src/components/customer/CustomerSearchOverlay.tsx` | ~16 — search icon, segment chips, suggestions, store/offer rows |
| `src/components/customer/CustomerLedgerOverlay.tsx` | ~14 — period/type filters, dividers, empty state, entries |
| `src/components/customer/StoreCatalogView.tsx` | ~14 — empty state, offer cards, points banner, category chips, product cards |
| `src/components/customer/CatalogCartDrawer.tsx` | 2 — points highlight bg e texto |
| `src/components/customer/CancelRedemptionButton.tsx` | 2 — botão cancelar bg/color |

### Padrão de conversão

Mesma abordagem já aplicada nos 12 arquivos anteriores:
- `${primary}06` → `brandAlpha(primary, 0.024)`
- `${primary}08` → `brandAlpha(primary, 0.03)`
- `${primary}10` → `brandAlpha(primary, 0.06)`
- `${primary}12` → `brandAlpha(primary, 0.07)`
- `${primary}15` → `brandAlpha(primary, 0.09)`
- `${primary}18` → `brandAlpha(primary, 0.1)`
- `${primary}20` → `brandAlpha(primary, 0.12)`
- `${primary}25` → `brandAlpha(primary, 0.15)`
- `${primary}30` → `brandAlpha(primary, 0.19)`
- `${primary}40` → `brandAlpha(primary, 0.25)`
- `${primary}90` → `brandAlpha(primary, 0.56)`
- `${primary}CC` → `brandAlpha(primary, 0.8)`
- `${fg}06` → `brandAlpha(fg, 0.024)`
- `${fg}08` → `brandAlpha(fg, 0.03)`
- `${fg}10` → `brandAlpha(fg, 0.06)`
- `${fg}15` → `brandAlpha(fg, 0.09)`
- `${fg}30` → `brandAlpha(fg, 0.19)`
- `${fg}35` → `brandAlpha(fg, 0.22)`
- `${fg}40` → `brandAlpha(fg, 0.25)`
- `${fg}45` → `brandAlpha(fg, 0.27)`
- `${fg}50` → `brandAlpha(fg, 0.31)`
- `${fg}55` → `brandAlpha(fg, 0.33)`
- `${fg}60` → `brandAlpha(fg, 0.37)`
- `${fg}65` → `brandAlpha(fg, 0.4)`
- `${fg}70` → `brandAlpha(fg, 0.44)`

Cada arquivo receberá `import { brandAlpha } from "@/lib/utils"` (ou adicionado ao import existente). Nenhuma alteração de lógica — apenas expressões de cor.

