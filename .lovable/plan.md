

## Solução Definitiva: API Direta do Divulgador Inteligente

### Diagnóstico Real

Descobri que o site **Divulgador Inteligente tem uma API pública JSON**:

```
GET https://api.divulgadorinteligente.com/api/products?sitename=ubizresgata&limit=500
```

Retorna TODOS os produtos em JSON estruturado, com dados completos:
- `title`, `image`, `price`, `price_from`, `link` (URL de afiliado real), `uuid` (slug)
- `seller` (shopee, mercadolivre, magalu, amazon)
- `coupon`, `free_shipping`, `installment`, `category`
- `metadata.merchant`, `metadata.tracked_link`

O Firecrawl scraping HTML com scroll NUNCA ia funcionar porque o site carrega via API interna. Agora podemos chamar essa API diretamente — sem Firecrawl, sem scroll, sem timeout.

### Alterações

#### 1. Edge Function — Reescrita para usar API direta
**Arquivo**: `supabase/functions/mirror-sync/index.ts`

Substituir toda a lógica de scraping HTML por:

```typescript
// 1. Fetch ALL products via public API (single call, ~1 second)
const apiUrl = `https://api.divulgadorinteligente.com/api/products?sitename=${siteName}&limit=500`;
const response = await fetch(apiUrl);
const { data: products } = await response.json();

// 2. Map each product to affiliate_deals format
for (const product of products) {
  const attrs = product.attributes;
  // attrs.title, attrs.price, attrs.image, attrs.uuid, attrs.seller, etc.
}
```

- **Sem Firecrawl** — chamada HTTP simples, sem créditos gastos
- **Sem scroll/timeout** — resposta em ~1 segundo
- **Dados mais ricos** — preço original, cupom, frete grátis, parcelamento, categoria, loja
- **Modo diagnóstico** mantido — retorna contagem API vs BD sem salvar
- **Deduplicação por `uuid`** (slug do produto) — chave perfeita e estável

Mapeamento de campos da API → tabela `affiliate_deals`:
| API field | DB column |
|---|---|
| `title` | `title` |
| `image` | `image_url` |
| `price` (parseado) | `price` |
| `price_from` (parseado) | `original_price` |
| `link` | `affiliate_url` |
| `uuid` | `origin_external_id` |
| `seller` | `store_name` |
| `coupon` | `badge_label` (se houver cupom) |
| `category` | `category` |

#### 2. Config — novo campo `sitename`
Na config, usar o campo `origin_url` existente para extrair o sitename (ex: URL `https://...divulgadorinteligente.com/ubizresgata` → sitename `ubizresgata`). Ou adicionar campo dedicado na config. Sem migração necessária — o código extrai do path.

#### 3. Debug UI — simplificação
**Arquivo**: `src/components/mirror-sync/MirrorSyncDebug.tsx`

Atualizar para mostrar métricas da API:
- Total de produtos retornados pela API
- Novos vs já existentes no BD
- Atualizados vs iguais
- Sem mais seções de "páginas visitadas" (agora é 1 chamada API)

**2 arquivos alterados** + redeploy.

**Resultado**: De 77 para ~195 ofertas, em ~5 segundos, sem Firecrawl.

