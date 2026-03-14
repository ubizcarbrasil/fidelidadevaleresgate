

## Plano: Corrigir busca de recibo e identificação de cliente

### Problema raiz
O webhook usa o endpoint e autenticação **errados**:
- **Endpoint atual**: `https://api.taximachine.com.br/api/integracao/recibo` com `Authorization: Basic ...`
- **Endpoint correto** (conforme docs): `https://api-vendas.taximachine.com.br/api/integracao/recibo` com header `api-key: {chave}`

Além disso, a busca de cliente só funciona por CPF, mas o recibo frequentemente vem com `cpf: null`.

### Mudanças

#### 1. Refatorar `processFinalized` em `machine-webhook/index.ts`

**Chamada à API TaxiMachine:**
- Trocar URL base para `https://api-vendas.taximachine.com.br`
- Trocar autenticação de `Authorization: Basic ...` para header `api-key: {integration.api_key}`
- Remover a chamada a `solicitacaoStatus` (desnecessária — o recibo já tem tudo)
- Fazer apenas `GET /api/integracao/recibo?id_mch={machineRideId}`

**Parsing da resposta do recibo:**
Baseado na estrutura real:
```text
{
  "success": true,
  "response": {
    "id_mch": "100003661",
    "condutor": { "nome", "telefone", "modelo", "placa" },
    "dados_solicitacao": { "valor": "4.00", ... },
    "cliente": { "cliente_id": "1", "nome": "Marcio", "cpf": null }
  }
}
```
- Valor: `response.dados_solicitacao.valor`
- CPF: `response.cliente.cpf` (pode ser null)
- Nome: `response.cliente.nome`
- Telefone do condutor: `response.condutor.telefone` (motorista, não passageiro)

**Busca de cliente em cascata (novo):**

Quando o recibo chega, extrair do `response.cliente`: CPF, nome. Buscar o cliente no sistema nesta ordem:
1. **Por CPF** (se presente e não vazio) → `customers.cpf = valor`
2. **Por telefone** (se tiver campo telefone do cliente no futuro, ou via nome) → `customers.phone`
3. **Por nome exato** (fallback) → `customers.name`

Se **não encontrar**, criar um novo cliente com os dados disponíveis:
- `name`: nome do cliente do recibo (ex: "Marcio")
- `cpf`: se disponível
- `phone`: se disponível
- `points_balance`: 0

Depois, **creditar os pontos** (1pt por R$1) normalmente.

#### 2. Migração SQL
- Nenhuma mudança de schema necessária — a tabela `customers` já tem campos `cpf`, `phone`, `name`, `email`

#### 3. Sem mudança na UI

### Fluxo revisado

```text
Webhook (status F)
  → GET api-vendas.taximachine.com.br/api/integracao/recibo?id_mch=X
     (header: api-key: integration.api_key)
  → Extrair valor + dados do cliente
  → Buscar cliente: CPF → phone → nome
  → Não encontrou? Criar novo cliente
  → Creditar pontos (1pt/R$1)
  → Notificar Telegram + callback
  → Retornar 200
```

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Refatorar `processFinalized`: novo endpoint, novo header de auth, busca de cliente em cascata (CPF → phone → nome), sempre retornar 200 |

