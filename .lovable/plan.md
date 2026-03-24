

## Problema

Cada página de listagem usa **scroll infinito** — o Firecrawl só captura os primeiros ~20 itens visíveis no carregamento inicial. O Map API também falhou (só encontrou 1 URL) porque o site não tem sitemap.xml.

**Evidência dos logs:**
- `/promocoes-do-dia`: 32 deals (de ~60+)
- `/lojas/shopee`: 20 deals (de ~50+)
- `/lojas/mercadolivre`: 20 deals
- `/lojas/amazon`: 20 deals
- `/lojas/magalu`: 17 deals
- Map API: apenas 1 URL descoberta

## Solução

O Firecrawl suporta o parâmetro `actions` que permite executar ações no navegador **antes** de extrair o HTML. Vamos adicionar múltiplos ciclos de scroll+wait para forçar o carregamento de todo o conteúdo lazy-loaded.

### Alteração

**Arquivo**: `supabase/functions/mirror-sync/index.ts`

Na chamada do Firecrawl scrape de cada página de listagem (Phase 1), adicionar ações de scroll:

```typescript
body: JSON.stringify({
  url,
  formats: ["html"],
  waitFor: 3000,
  onlyMainContent: false,
  actions: [
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
    { type: "scroll", direction: "down" },
    { type: "wait", milliseconds: 2000 },
  ],
}),
```

Isso faz 7 scrolls com 2s de espera entre cada um (~16s por página), carregando todo o conteúdo do infinite scroll.

### Resultado esperado

- Cada página vai retornar TODOS os itens em vez de apenas os primeiros ~20
- De ~77 para ~194 ofertas importadas
- Redeploy da edge function

**1 arquivo alterado** + redeploy.

