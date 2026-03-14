

## Diagnóstico do problema

A tabela `machine_integrations` usa **uma única coluna `api_key`** para dois propósitos diferentes:

1. **Autenticação do webhook** — a TaxiMachine envia o header `x-api-secret` com essa chave para se identificar ao nosso webhook
2. **Consulta de recibos** — nosso webhook envia essa mesma chave como header `api-key` para a API `api-vendas.taximachine.com.br`

Essas são chaves **diferentes** na TaxiMachine. O erro "Chave da API inválida" acontece porque a chave usada para autenticar o webhook (vinda do painel de integração da TaxiMachine) não é a mesma chave que autoriza consultas de recibo na API de vendas.

## Solução

Separar em duas colunas distintas na tabela `machine_integrations`:

| Coluna | Uso | Header |
|---|---|---|
| `api_key` (existente) | Autenticação do webhook (TaxiMachine → nosso servidor) | `x-api-secret` |
| `receipt_api_key` (nova) | Consulta de recibos (nosso servidor → api-vendas) | `api-key` |

### Mudanças

1. **Migração SQL** — Adicionar coluna `receipt_api_key text default null` à tabela `machine_integrations`

2. **`supabase/functions/machine-webhook/index.ts`** — Na função `processFinalized`, usar `integration.receipt_api_key` (em vez de `integration.api_key`) no header `api-key` da chamada de recibo. Validar que `receipt_api_key` existe antes de chamar a API.

3. **`supabase/functions/register-machine-webhook/index.ts`** — Aceitar campo `receipt_api_key` no body e salvar na coluna correspondente no upsert.

4. **`src/pages/MachineIntegrationPage.tsx`** — Adicionar campo separado "Chave da API de Vendas" (para recibos) tanto na aba "Por credenciais" quanto na aba "Por URL", mantendo o campo existente "Chave de acesso" para autenticação do webhook.

