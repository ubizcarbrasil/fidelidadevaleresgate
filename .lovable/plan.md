

## Auto-criar cliente no webhook quando CPF não encontrado

### Situação atual

Ambas as Edge Functions (`earn-webhook` e `machine-webhook`) **rejeitam a requisição** se não encontram um cliente com o CPF informado. Nenhuma delas cria o cliente automaticamente.

### Plano

Alterar ambas as funções para **criar automaticamente** um registro de `customers` quando o CPF não existir na marca, usando a `branch_id` da loja envolvida na transação.

#### 1. `earn-webhook/index.ts` (linhas 353-368)

Atualmente retorna 404 se customer não encontrado. Alterar para:
- Se não encontrou customer pelo CPF, criar um novo com:
  - `brand_id` = da API key
  - `branch_id` = da loja (`store.branch_id`)
  - `cpf` = CPF limpo
  - `name` = "Cliente " + últimos 4 dígitos do CPF (ex: "Cliente •••3456")
  - `points_balance` = 0, `money_balance` = 0
- Log de auditoria `EARN_WEBHOOK_CUSTOMER_CREATED`
- Continuar o fluxo normal de pontuação com o cliente recém-criado

#### 2. `machine-webhook/index.ts` (linhas 207-240)

Atualmente só credita pontos se encontra o cliente. Alterar para:
- Se tem CPF mas não encontrou customer, criar um novo com:
  - `brand_id` = da integração
  - `branch_id` = primeira filial da marca (buscar via query)
  - `cpf` = CPF do passageiro
  - `name` = "Passageiro •••" + últimos 4 dígitos do CPF
- Log de auditoria `MACHINE_CUSTOMER_CREATED`
- Prosseguir com crédito de pontos normalmente

#### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/earn-webhook/index.ts` | Auto-criar customer no passo 4 |
| `supabase/functions/machine-webhook/index.ts` | Auto-criar customer na seção de crédito |

Nenhuma migração SQL necessária — a tabela `customers` já aceita `cpf` e `user_id` é nullable.

