

## Problema

O scraper atual faz apenas 1 request para a URL principal (`/ubizresgata`), que mostra ~23 ofertas. O site tem 194 ofertas distribuídas por sub-páginas de lojas (Amazon, Shopee, Mercado Livre, Magalu). A coluna `extra_pages` já existe na tabela `mirror_sync_config` mas não é usada.

## Plano

### 1. Edge Function — scrape multi-página

**Arquivo**: `supabase/functions/mirror-sync/index.ts`

Após carregar o config, construir lista de URLs e iterar sobre cada uma:

```typescript
const extraPages = config?.extra_pages || [];
const defaultPages = [
  "/promocoes-do-dia",
  "/lojas/shopee",
  "/lojas/mercadolivre", 
  "/lojas/amazon",
  "/lojas/magalu",
];
const pagePaths = extraPages.length > 0 ? extraPages : defaultPages;
const urls = [originUrl, ...pagePaths.map(p => 
  p.startsWith("http") ? p : `${originUrl}${p}`
)];
```

Mover o bloco de scrape+parse para um `for (const url of urls)` loop. Acumular todos os `parsedDeals` num array antes de processar inserts/updates. A deduplicação por slug já previne duplicatas entre páginas.

### 2. UI de configuração — campo de URLs extras

**Arquivo**: `src/components/mirror-sync/MirrorSyncConfig.tsx`

Adicionar um `Textarea` para editar `extra_pages` (uma URL/path por linha). Valor default pré-populado com as sub-páginas padrão. Incluir no estado do form e no save.

### 3. Redeploy da Edge Function

---

**2 arquivos alterados** + redeploy. Resultado esperado: de ~23 para ~194 ofertas.

