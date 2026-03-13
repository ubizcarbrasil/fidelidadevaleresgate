

## Corrigir crash do `machine-webhook` (incompatibilidade com rateLimiter)

### Problema

O erro nos logs da Edge Function mostra:
```
TypeError: Cannot read properties of undefined (reading 'get')
    at rateLimitKey (rateLimiter.ts:71:26)
```

A função `machine-webhook` chama o rate limiter com a API errada:

| Chamada atual no webhook | Assinatura real da função |
|---|---|
| `rateLimitKey("machine-webhook", ip)` | `rateLimitKey(prefix, req: Request, extra?)` |
| `checkRateLimit(sb, rlKey, 30, 60)` | `checkRateLimit(sb, key, { maxRequests, windowSeconds })` |
| `rateLimitResponse(corsHeaders)` | `rateLimitResponse(result, corsHeaders)` |

O segundo argumento de `rateLimitKey` espera um `Request`, mas recebe uma string (`ip`). Isso causa o crash antes de qualquer resposta ser enviada, resultando no "TypeError: Load failed" no navegador.

### Plano

Corrigir as 3 chamadas no `supabase/functions/machine-webhook/index.ts` (linhas 59-64):

1. `rateLimitKey("machine-webhook", req)` -- passar o objeto `req` em vez de `ip`
2. `checkRateLimit(sb, rlKey, { maxRequests: 30, windowSeconds: 60 })` -- passar objeto de opções
3. `rateLimitResponse(rlResult, corsHeaders)` -- passar o resultado do rate limit + verificar via `rlResult.allowed`

Remover a função `getClientIp` (linha 17-23) que já não é necessária pois `rateLimitKey` extrai o IP internamente. O `ip` para auditoria pode ser extraído inline.

#### Arquivo a modificar
- `supabase/functions/machine-webhook/index.ts`

