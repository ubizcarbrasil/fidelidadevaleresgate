

## Plano: Corrigir formulário de credenciais — remover "API de Vendas" e separar Cidade vs Matriz

### Problema
O formulário inventou um campo "Chave da API de Vendas (recibos)" (`receipt_api_key`) que não existe na TaxiMachine. A estrutura correta é simples:

- **Credenciais da Cidade**: `api-key`, `usuário`, `senha` → usadas no endpoint V1 (`/api/v1/request/`)
- **Credenciais da Matriz**: `api-key`, `usuário`, `senha` → usadas no endpoint Recibo (`/api/integracao/recibo`)

### Alterações

#### 1. `src/pages/MachineIntegrationPage.tsx`
- **Remover** campos `receipt_api_key` e `urlReceiptApiKey` do formulário (ambas as tabs)
- **Renomear** labels para ficar claro:
  - "Chave de acesso (webhook)" → **"api-key da Cidade"** com descrição: "Token da cidade no painel TaxiMachine. Usada para consultar corridas no V1."
  - "Usuário" / "Senha" → **"Usuário da Cidade"** / **"Senha da Cidade"**
- **Manter** a seção "Credenciais da Matriz (Recibo)" como está (api-key, user, pass da matriz)
- Remover estados `receiptApiKey`, `showReceiptApiKey`, `urlReceiptApiKey`, `showUrlReceiptApiKey`

#### 2. `supabase/functions/machine-webhook/index.ts` — `processFinalized`
- Mudar a lógica de `receiptApiKey` para usar `integration.api_key` diretamente como a api-key da cidade para o V1
- Remover referência a `receipt_api_key` — o campo `api_key` da integração JÁ É a chave da cidade
- A validação `url-only-` continua igual

#### 3. `supabase/functions/_shared/fetchRideData.ts`
- Sem alteração — `buildApiHeaders` já é genérico

#### 4. `supabase/functions/test-machine-credentials/index.ts` e `retry-failed-rides/index.ts`
- Mesma correção: usar `api_key` em vez de `receipt_api_key` para montar os headers da cidade

#### 5. `register-machine-webhook/index.ts`
- Remover passagem de `receipt_api_key` no upsert (campo pode ficar no banco mas não será mais usado)

### Resultado
- Formulário claro: **Cidade** (api-key + user + pass) e **Matriz** (api-key + user + pass)
- V1 usa credenciais da cidade, Recibo usa credenciais da matriz
- Sem campo fantasma "API de Vendas"

