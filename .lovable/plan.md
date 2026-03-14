

## Diagnóstico

Os logs mostram duas fases de erro:
1. **Antes** (só `api-key`): "Chave da API inválida" — Basic Auth estava faltando
2. **Depois** (só Basic Auth): "Chave da app não informada" — `api-key` agora está faltando

A API da TaxiMachine (`api-vendas`) exige **ambos os headers simultaneamente**:
- `Authorization: Basic {base64(user:pass)}`
- `api-key: {chave}`

## Solução

Adicionar o header `api-key` de volta junto com o Basic Auth na chamada de recibo.

### Mudança

| Arquivo | O que muda |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Linha 196: adicionar `"api-key": integration.api_key` ao objeto headers, junto com o `Authorization: Basic` |

### Código

```typescript
// Linha 194-197 — ANTES
const receiptRes = await fetch(
  `${machineBaseUrl}/api/integracao/recibo?id_mch=${machineRideId}`,
  { headers: { "Authorization": `Basic ${basicAuth}` } }
);

// DEPOIS — ambos os headers
const receiptRes = await fetch(
  `${machineBaseUrl}/api/integracao/recibo?id_mch=${machineRideId}`,
  { headers: { 
    "Authorization": `Basic ${basicAuth}`,
    "api-key": integration.api_key || ""
  } }
);
```

### Validação atualizada

Além de validar `basic_auth_user` e `basic_auth_password`, a função também deve verificar se `api_key` existe e não é um placeholder (`url-only-...`). Se faltar, retornar erro claro informando que a chave de acesso é necessária.

