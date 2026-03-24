

## Refatoração Completa do Mirror Sync — Diagnóstico + Cobertura Real

### Diagnóstico do Problema Atual

Os logs mostram consistentemente 77 ofertas de 6 páginas. O scroll simulado do Firecrawl parece **não estar funcionando** — os tamanhos de HTML retornados (45-77KB) são os mesmos de antes do scroll. O site provavelmente usa virtual scrolling ou carrega conteúdo via API interna que o scroll do Firecrawl não aciona.

A estratégia correta é a abordagem em 2 fases: primeiro descobrir todos os links de oferta, depois visitar cada um individualmente.

---

### Alterações

#### 1. Edge Function — Reescrita completa com diagnóstico
**Arquivo**: `supabase/functions/mirror-sync/index.ts`

Nova arquitetura com 2 modos: `sync` (padrão) e `diagnose` (dry-run).

**Fase 1 — Descoberta de links**
- Scrape das páginas de listagem em paralelo (lote de 3)
- Extrair TODOS os `href` que contenham `/ubizresgata/p/` (não apenas os cards parseados)
- Registrar por página: URL, HTML length, total links encontrados, total cards parseados, tempo de execução, primeiros 10 títulos/links
- Deduplicar por URL normalizada (não por título+preço)

**Fase 2 — Scrape individual de produtos novos**
- Para cada link único descoberto que não existe no BD (por slug), fazer scrape individual
- Concorrência controlada: lotes de 5 requests simultâneos
- Parser dedicado para página de detalhe do produto

**Diagnóstico detalhado salvo no `details` JSONB do log:**
```json
{
  "pages": [
    { "url": "...", "html_length": 69058, "links_found": 23, "cards_parsed": 23, 
      "discarded": 0, "duration_ms": 5200, "sample_titles": [...], "sample_links": [...] }
  ],
  "discovery": {
    "total_links_raw": 132, "unique_links": 95, "duplicates_cross_page": 37,
    "already_in_db": 77, "new_to_scrape": 18
  },
  "dedup_audit": {
    "by_url": 37, "by_slug": 0, "by_hash": 0,
    "discarded_no_title": 2, "discarded_no_link": 0
  },
  "phase2": {
    "scraped": 18, "parsed_ok": 15, "parse_failed": 3, "samples": [...]
  },
  "totals": { "persisted": 92, "updated": 77, "new": 15, "errors": 3 }
}
```

**Modo diagnóstico** (`mode: "diagnose"`):
- Executa apenas Fase 1
- Não salva nada no BD
- Retorna o relatório completo de descoberta

**Chave de deduplicação** (prioridade):
1. URL canônica normalizada (sem query params)
2. Slug extraído do path (`/p/SLUG`)
3. Hash como fallback

#### 2. Aba Debug — Painel de diagnóstico completo
**Arquivo**: `src/components/mirror-sync/MirrorSyncDebug.tsx` (reescrita)

Novo conteúdo:
- Botão "Executar diagnóstico" que chama `mirror-sync` com `mode: "diagnose"`
- Mostra resultado: páginas visitadas, itens por página, links únicos descobertos, cobertura estimada
- Tabela de páginas com colunas: URL, Links, Cards, Tempo, Status
- Seção "Auditoria de deduplicação" com contadores
- Amostras reais de links e títulos encontrados
- Mostrar último log detalhado da sync normal (campo `details`)

#### 3. API client — novo método diagnóstico
**Arquivo**: `src/lib/api/mirrorSync.ts`

Adicionar:
```typescript
export async function runMirrorDiagnose(brandId: string) {
  const { data, error } = await supabase.functions.invoke("mirror-sync", {
    body: { brand_id: brandId, mode: "diagnose" },
  });
  if (error) throw new Error(error.message);
  return data;
}
```

---

### Detalhes Técnicos

**Concorrência controlada** — helper para processar em lotes:
```typescript
async function processInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<any>) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}
```

**Extração alternativa de links** — além do regex de cards, buscar todos os `href` com `/p/`:
```typescript
const linkRegex = /href="([^"]*\/ubizresgata\/p\/[^"]+)"/gi;
```

Isso captura links que o parser de cards pode perder por não reconhecer a estrutura HTML.

**3 arquivos alterados** + redeploy da edge function.

