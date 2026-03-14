

## Problema encontrado

A imagem do usuário mostra o cURL oficial da TaxiMachine para buscar recibos:

```
curl --location 'https://api-vendas.taximachine.com.br/api/integracao/recibo?id_mch=100003661' \
--header 'api-key: {{api-key}}'
```

**Só precisa do header `api-key`**. Não usa `Authorization: Basic`.

Nosso código (linha 210-211) envia **dois headers**:
```typescript
headers: { "Authorization": `Basic ${basicAuth}`, "api-key": receiptApiKey }
```

E na validação (linha 179) **exige** `basic_auth_user` e `basic_auth_password`, bloqueando integrações que não têm essas credenciais.

O header `Authorization: Basic` extra pode estar causando a rejeição pela API da TaxiMachine.

## Plano de correção

### 1. `supabase/functions/machine-webhook/index.ts` — função `processFinalized`

- **Remover** a exigência de `basicUser`/`basicPass` da validação obrigatória (linha 179)
- **Enviar** apenas o header `api-key` na chamada de recibo
- Se `basicUser` e `basicPass` estiverem preenchidos, incluir `Authorization: Basic` como **opcional** (para compatibilidade futura), mas **não bloquear** se estiverem vazios
- Simplificar a validação: só exigir `receiptApiKey`

**Antes:**
```typescript
if (!basicUser || !basicPass || !hasValidReceiptKey) { ... }
// ...
headers: { "Authorization": `Basic ${basicAuth}`, "api-key": receiptApiKey }
```

**Depois:**
```typescript
if (!hasValidReceiptKey) { ... }
// ...
const headers: Record<string, string> = { "api-key": receiptApiKey };
if (basicUser && basicPass) {
  headers["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
}
```

### 2. Nenhuma mudança no banco ou UI necessária
A coluna `receipt_api_key` já existe. Os campos de Basic Auth continuam opcionais na UI.

