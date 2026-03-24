

## Problema

A edge function `mirror-sync` não encontra nenhuma oferta porque o regex do parser espera URLs relativas (`/ubizresgata/p/XXX`) mas o HTML real contém URLs absolutas (`https://www.divulgadorinteligente.com/ubizresgata/p/XXX`).

**Regex atual (linha 58):**
```
/<a[^>]*href="(\/ubizresgata\/p\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
```

**HTML real:**
```html
<a class="sc-a1e0a9be-0 ifztke" href="https://www.divulgadorinteligente.com/ubizresgata/p/OQsYd7EvWp">
```

## Correção

Atualizar o regex para aceitar tanto URLs absolutas quanto relativas. Também corrigir o `extractSlug` e a construção da `fullUrl` para lidar com ambos os formatos.

### Alteração em `supabase/functions/mirror-sync/index.ts`

**Linha 58** — regex do parser:
```typescript
// DE:
const cardRegex = /<a[^>]*href="(\/ubizresgata\/p\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

// PARA:
const cardRegex = /<a[^>]*href="((?:https?:\/\/[^"]*)?\/ubizresgata\/p\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
```

**Linha 65** — construção da URL:
```typescript
// DE:
const fullUrl = `${baseUrl}${href}`;

// PARA:
const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
```

**1 arquivo, 2 linhas.** Requer re-deploy da edge function.

