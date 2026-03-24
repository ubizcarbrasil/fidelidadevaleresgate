

## Problema

A Edge Function está dando **timeout** ("Failed to send a request to the Edge Function"). Com as ações de scroll adicionadas, cada página leva ~20s no Firecrawl. Com 6 páginas sequenciais + Map API + scrapes individuais, o tempo total ultrapassa o limite de 60s da Edge Function.

**Evidência**: Logs anteriores (sem scroll) completaram em ~180s (já no limite). Com scroll, cada página agora leva muito mais tempo.

## Solução

Duas mudanças na Edge Function:

### 1. Scrape em paralelo (não sequencial)

Trocar o `for...of` loop por `Promise.all` para fazer todas as 6 páginas simultaneamente. Reduz o tempo de 6×20s = 120s para ~20s (o tempo de UMA página).

```typescript
// DE: for (const url of urls) { await fetch(...) }
// PARA:
const scrapeResults = await Promise.all(
  urls.map(url => fetch("https://api.firecrawl.dev/v1/scrape", { ... }).then(r => r.json()).catch(e => null))
);
```

### 2. Remover Map API + scrapes individuais

A Phase 2 (Map) e Phase 3 (scrapes individuais) consomem tempo e retornaram 0 resultados extras. Removê-las. O scroll nas listagens + paralelismo já deve cobrir todas as ofertas.

### 3. Reduzir scroll actions para 5 ciclos

7 scrolls é excessivo. 5 ciclos (10s) deve ser suficiente para ~50 itens por página.

---

**1 arquivo alterado** (`supabase/functions/mirror-sync/index.ts`) + redeploy.

**Resultado esperado**: Execução em ~25s em vez de >120s. Sem timeout.

