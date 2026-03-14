

## Diagnóstico

Os logs confirmam: **"Chave da API inválida"** — a TaxiMachine rejeita o header `api-key`. 

Olhando o screenshot que você enviou, a autenticação da API de recibos usa **Basic Auth** (Base64 do email:senha), **não** o header `api-key`. O campo destacado em vermelho ("Base64 Auth Header") é exatamente o que deve ser enviado como `Authorization: Basic {base64}`.

## Solução

Trocar a autenticação no `processFinalized` de `api-key` para `Authorization: Basic {base64(user:pass)}`, usando `basic_auth_user` e `basic_auth_password` já armazenados na tabela `machine_integrations`.

### Mudança

| Arquivo | O que muda |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Na função `processFinalized`: trocar header `api-key: {apiKey}` por `Authorization: Basic {btoa(user:pass)}`. Validar que `basic_auth_user` e `basic_auth_password` existem. Remover a validação de placeholder do `api_key` (não é mais necessário para auth do recibo). |

### Código (resumo)

```typescript
// ANTES (linha 193-195)
const receiptRes = await fetch(url, {
  headers: { "api-key": apiKey }
});

// DEPOIS
const basic