

## Problema

O site usa **scroll infinito** — cada página só renderiza ~20 ofertas inicialmente. O Firecrawl com `waitFor: 3000` captura apenas o primeiro lote visível. Com 6 URLs estamos pegando ~77 ofertas únicas das ~194 disponíveis.

## Solução

Usar a **Firecrawl Map API** antes do scrape. O Map descobre todas as URLs do site sem precisar renderizar JavaScript — ele analisa o sitemap e links internos. Com isso, encontramos todos os links `/ubizresgata/p/SLUG` e depois fazemos scrape individual de cada produto, ou fazemos scrape apenas das páginas de listagem com scroll simulado mais longo.

**Abordagem escolhida**: Map API para descobrir todas as URLs de produto → para cada URL descoberta, extrair o slug → para os slugs novos (não existentes no BD), fazer scrape individual da página do produto para pegar título, preço, imagem, loja.

### Alterações

**Arquivo**: `supabase/functions/mirror-sync/index.ts`

#### Passo 1 — Fase de descoberta com Map API
Antes do loop de scrape, chamar o Firecrawl Map para descobrir todas as URLs:

```typescript
// Discover all product URLs via Map API
const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${firecrawlKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: originUrl,
    search: "ubizresgata/p/",
    limit: 500,
    includeSubdomains: false,
  }),
});
const mapData = await mapResponse.json();
const allProductUrls: string[] = mapData?.links || [];
```

#### Passo 2 — Processar URLs descobertas
Para cada URL de produto descoberta pelo Map:
- Extrair o slug
- Verificar se já existe no BD (por slug)
- Se não existe, fazer scrape individual da página do produto

```typescript
for (const productUrl of newProductUrls) {
  // Scrape individual product page
  const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    body: JSON.stringify({ url: productUrl, formats: ["html"], waitFor: 2000 }),
    ...
  });
  // Parse title, price, image from product detail page
}
```

#### Passo 3 — Manter scrape de listagem como fallback
Manter o loop atual de scrape de páginas de listagem para pegar os dados iniciais rapidamente. O Map + scrape individual complementa com as ofertas que o scroll infinito esconde.

#### Passo 4 — Parser para página individual de produto
Adicionar uma função `parseProductPage(html, url)` que extrai dados de uma página de detalhe de produto (layout diferente da listagem).

### Resultado esperado

- Map API descobre ~194 URLs de produto (1 credit)
- Scrape das páginas de listagem pega ~77 ofertas com dados completos
- Scrape individual apenas dos ~117 produtos restantes (novos)
- Total: ~194 ofertas importadas

**1 arquivo alterado** (`supabase/functions/mirror-sync/index.ts`) + redeploy.

