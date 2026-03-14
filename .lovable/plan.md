

## Plano: Painel de consulta de clientes pontuados na página de Integração de Mobilidade

### Objetivo
Adicionar uma seção na `MachineIntegrationPage.tsx` (visível quando a integração está ativa) que permite buscar e visualizar dados dos clientes pontuados pelas corridas, incluindo: nome, ID, telefone, CPF, e-mail, saldo de pontos e um link para acessar o extrato do cliente.

### Dados disponíveis
- **`machine_rides`**: `passenger_cpf`, `points_credited`, `ride_value` — vincula corrida ao CPF
- **`customers`**: `id`, `name`, `phone`, `cpf`, `points_balance`, `user_id` — dados do cliente
- **`profiles`** (via `user_id`): `email`, `full_name` — para obter o e-mail

### O que será feito

**1. Nova seção "Clientes Pontuados" na página (após o feed de eventos)**
- Campo de busca por nome, CPF ou telefone
- Tabela com colunas: Nome, CPF, Telefone, E-mail, Pontos (saldo), Pontos ganhos (corridas)
- Botão para abrir um drawer/overlay com o extrato detalhado do cliente (entries do `points_ledger`)

**2. Consulta**
- Query em `machine_rides` JOIN `customers` via `passenger_cpf = cpf` filtrado pelo `brand_id`
- Ou diretamente `customers` com filtro na marca + busca, e para cada cliente buscar total de pontos de corridas na `machine_rides`
- E-mail obtido via JOIN com `profiles` usando `customers.user_id = profiles.id`

**3. Drawer de extrato do cliente**
- Ao clicar em um cliente, abre um drawer mostrando:
  - Dados completos (nome, CPF, telefone, e-mail, saldo atual)
  - Histórico do `points_ledger` (créditos e débitos) para verificar se os pontos entraram na carteira

### Alterações

| Arquivo | Ação |
|---|---|
| `src/pages/MachineIntegrationPage.tsx` | Adicionar seção de consulta de clientes pontuados com busca, tabela e drawer de extrato |

Nenhuma alteração de banco de dados necessária — todos os dados já existem nas tabelas `customers`, `machine_rides`, `profiles` e `points_ledger`.

