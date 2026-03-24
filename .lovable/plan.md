

## Problema

O parser da Edge Function `mirror-sync` falha na extração de preços para ~57% das ofertas (13 de 23). Duas causas:

1. **Regex com lazy match trunca o conteúdo do card**: `([\s\S]*?)<\/a>` captura o mínimo possível, parando em qualquer `</a>` interno antes de chegar à seção de preço. Os cards da seção Shopee têm estrutura HTML diferente dos cards de "Promoções do dia".

2. **Dados antigos nunca são atualizados**: A re-sincronização compara `existing.price !== deal.price` → se ambos são `null`, resulta em `false` e o registro é ignorado. Os 13 registros importados antes da correção ficam permanentemente com preço null.

**Evidência**: O markdown do site mostra que TODAS as 23 ofertas têm preço (ex: "Mala GRANDE" = R$ 149,90). Porém o re-sync retorna `total_skipped: 23, total_updated: 0`.

---

## Plano de Correção

### 1. Melhorar o parser na Edge Function

**Arquivo**: `supabase/functions/mirror-sync/index.ts`

**A. Trocar regex de card** — de lazy para greedy com lookahead:
```typescript
// DE (lazy - trunca o card):
/<a[^>]*href="((?:https?:\/\/[^"]*)?\/ubizresgata\/p\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi

// PARA (greedy até o próximo </a> correto):
/<a[^>]*href="((?:https?:\/\/[^"]*)?\/ubizresgata\/p\/[^"]+)"[^>]*>([\s\S]+?)<\/a>\s*(?=<a |<\/div|$)/gi
```

Ou abordagem alternativa mais robusta: capturar todo o bloco entre dois links de `/ubizresgata/p/`:
```typescript
// Encontra todos os hrefs de produto
const hrefRegex = /href="((?:https?:\/\/[^"]*)?\/ubizresgata\/p\/[^"]+)"/gi;
// Para cada href, captura o bloco HTML circundante entre ele e o próximo href
```

**B. Ativar debug mode temporário**: adicionar `console.log` com o cardHtml capturado para os cards sem preço, permitindo diagnóstico preciso.

### 2. Forçar atualização de registros stale

Na lógica de dedup, adicionar condição: se o registro existente tem `price IS NULL` e o novo parse também retorna `null`, marcar como `sync_error` em vez de skip. Ou melhor, **sempre atualizar** se o existente tem `sync_status = 'synced'` mas `price IS NULL`:

```typescript
const needsUpdate =
  existing.price !== deal.price ||
  existing.image_url !== deal.image_url ||
  existing.title !== deal.title ||
  (existing.price === null && deal.price !== null) ||  // força update se antes era null
  existing.badge_label === '100%';  // corrige badges errados
```

Wait — essa condição já é coberta por `existing.price !== deal.price` se deal.price não for null. O problema real é que o parser TAMBÉM retorna null. Então o fix 1 (parser) é o essencial.

### 3. Após fix do parser, limpar dados antigos

Rodar uma SQL migration ou usar o re-sync para forçar update dos registros antigos. Opção: deletar os registros com `badge_label = '100%'` e `price IS NULL` para que o próximo sync os recrie com dados corretos:

```sql
DELETE FROM affiliate_deals 
WHERE origin = 'divulgador_inteligente' 
AND price IS NULL 
AND badge_label = '100%';
```

### 4. Redeploy + Re-sync

Deploy da edge function corrigida e execução de nova sincronização.

---

## Resumo

| Etapa | Ação |
|-------|------|
| 1 | Fix regex do parser para capturar conteúdo completo do card |
| 2 | Limpar registros stale (price null + badge 100%) |
| 3 | Redeploy edge function |
| 4 | Re-sync para popular dados corretos |

**1 arquivo alterado** (`supabase/functions/mirror-sync/index.ts`), 1 query SQL de limpeza.

