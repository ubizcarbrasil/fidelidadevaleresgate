

## Corrigir chamada à API TaxiMachine

### Problemas identificados (baseado nas screenshots)

1. **URL base errada**: o código usa `https://api-vendas.taximachine.com.br`, mas a API correta é `https://api.taximachine.com.br`
2. **Header `User-Agent` faltando**: a API exige `User-Agent: ua-ubizcar` em todas as chamadas

### Alterações

**Arquivo: `supabase/functions/_shared/fetchRideData.ts`**

1. Alterar `BASE_URL` de `https://api-vendas.taximachine.com.br` para `https://api.taximachine.com.br`
2. Adicionar `"User-Agent": "ua-ubizcar"` na função `buildApiHeaders()`

Essas duas mudanças afetam automaticamente todas as chamadas (webhook, retry, teste de credenciais) pois todos usam o shared helper.

