

## Plano: Adicionar módulos faltantes ao mapeamento da Home

### Diagnóstico
O mapeamento atual (`SECTION_MODULE_MAP`) cobre apenas 3 seções. Existem mais 2 módulos no banco que correspondem a seções nativas da Home mas não estão mapeados:

| Seção nativa | Módulo (key) | Status |
|---|---|---|
| ACHADINHOS | `affiliate_deals` | ✅ Mapeado |
| COMPRE_COM_PONTOS | `customer_product_redeem` | ✅ Mapeado |
| EMISSORAS | `offers` | ✅ Mapeado |
| BANNERS | `banners` | ❌ Faltando |
| CATEGORIES | `categories` | ❌ Faltando |
| FOR_YOU | (sem módulo correspondente) | — OK |

### Alteração

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx` (linha 114-118)

Adicionar `BANNERS` e `CATEGORIES` ao `SECTION_MODULE_MAP`:

```tsx
const SECTION_MODULE_MAP: Record<string, string> = {
  ACHADINHOS: "affiliate_deals",
  COMPRE_COM_PONTOS: "customer_product_redeem",
  EMISSORAS: "offers",
  BANNERS: "banners",
  CATEGORIES: "categories",
};
```

### Resultado
Desativar o módulo "Banners" ou "Categorias" no painel de módulos agora também oculta a seção correspondente na Home do cliente.

| Arquivo | Ação |
|---|---|
| `src/pages/customer/CustomerHomePage.tsx` | Adicionar 2 entradas ao mapeamento |

