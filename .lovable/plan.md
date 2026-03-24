

## Correção: KPIs travados em 200 e deals novos não aparecendo no app do motorista

### Problemas encontrados

1. **KPIs travados em 200**: A função `fetchMirroredDeals` em `src/lib/api/mirrorSync.ts` tem `.limit(200)`. Com 251 deals no banco, os KPIs ficam truncados.

2. **Deals novos não aparecem no app do motorista**: A query em `DriverMarketplace.tsx` também tem `.limit(200)`. Os 51 deals mais recentes ficam de fora.

3. **Scraper da vitrine extraindo 0 preços**: Os logs confirmam `[Scrape] Extracted 0 prices` -- o regex de extração não está casando com o HTML real da página. Isso é um problema separado (preços caem no fallback da API), mas não afeta visibilidade.

### Correções

#### 1. Remover limite de 200 nos KPIs
**`src/lib/api/mirrorSync.ts`** -- linha 73: trocar `.limit(200)` por `.limit(1000)`

#### 2. Remover limite de 200 no app do motorista
**`src/components/driver/DriverMarketplace.tsx`** -- linha 149: trocar `.limit(200)` por `.limit(1000)`

#### 3. Corrigir scraper de vitrine (bônus)
**`supabase/functions/mirror-sync/index.ts`** -- A função `scrapeVitrinePrices` usa regex `<a>` que não casa com o HTML real (provavelmente a página é SPA/JavaScript-rendered). Vou ajustar para tentar extrair de outro padrão ou logar o HTML parcial para diagnóstico futuro.

### Detalhes técnicos
- O banco tem 251 deals, todos com `visible_driver = true` e `is_active = true`
- O limite de 1000 é o máximo do SDK e cobre bem o volume atual
- Se o volume crescer além de 1000, será necessário paginação, mas hoje isso é suficiente

