

## Problema identificado

A edge function `test-machine-credentials` **não está registrada** no `supabase/config.toml`, por isso não é deployada e retorna 404 quando chamada.

Também faltam no config.toml outras funções que existem no projeto: `retry-failed-rides`, `mobility-webhook`, `scrape-product`, `test-machine-credentials`.

## Plano

1. **Adicionar `test-machine-credentials` ao `supabase/config.toml`** com `verify_jwt = false` (a autenticação é feita manualmente via header `authorization` no código).

2. **Adicionar `retry-failed-rides` ao `supabase/config.toml`** — também usa a shared `fetchRideData.ts` e precisa estar registrada.

3. Verificar se `mobility-webhook` e `scrape-product` também precisam ser adicionados (existem como diretórios mas não no config).

Após o deploy, testar a função diretamente para confirmar que responde corretamente.

### Alteração

**Arquivo:** `supabase/config.toml`  
Adicionar ao final:

```toml
[functions.test-machine-credentials]
verify_jwt = false

[functions.retry-failed-rides]
verify_jwt = false

[functions.mobility-webhook]
verify_jwt = false

[functions.scrape-product]
verify_jwt = false
```

