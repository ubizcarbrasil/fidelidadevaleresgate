

## Problema raiz confirmado

Analisei os logs e o banco de dados em detalhe:

- **Endpoint Recibo**: retorna `400 "Solicitação não encontrada"` para todas as corridas
- **Endpoint Request V1**: retorna o valor da corrida e dados do **motorista**, mas **não retorna dados do passageiro** (sem campo `client`, `passenger` ou `stops[0].client`)
- Resultado: todos os 51+ clientes estão como `"Passageiro corrida #675..."` com CPF, telefone e e-mail nulos
- Todas as notificações têm `customer_name = null`, `customer_phone = null`, `customer_cpf_masked = null`

O V1 retorna `driver.name`, `driver.phone` e `driver.cpf` — o motorista é a única pessoa identificável na resposta atual.

## Plano de correção (4 telas)

### 1. Migração: adicionar campos

- Adicionar coluna `email` na tabela `customers` (text, nullable)
- Adicionar coluna `driver_name` na tabela `machine_ride_notifications`
- Adicionar coluna `driver_name` na tabela `machine_rides`

### 2. Backend: salvar nome do motorista

- **`machine-webhook`**: já extrai `driverName` do V1 mas não salva. Passar a gravar `driver_name` em `machine_rides` e `machine_ride_notifications`
- **`send-telegram-ride-notification`**: adicionar campo `driver_name` na mensagem (ex: "🚗 Motorista: Michel Santiago")
- **`retry-failed-rides`**: salvar `driver_name` no backfill

### 3. UI: Página de Clientes (CustomersPage)

- Adicionar coluna **CPF** na tabela (já existe no banco, não é exibido)
- Adicionar coluna **E-mail** (mostra "—" quando vazio)
- Permitir editar CPF e e-mail no formulário de edição do cliente

### 4. UI: Últimas pontuações (MachineIntegrationPage)

- Quando `customer_name` for null, exibir `driver_name` com label "Motorista:" para diferenciar
- Manter exibição de CPF mascarado e telefone quando disponíveis

### 5. UI: Clientes pontuados (ScoredCustomersPanel)

- Já exibe nome, CPF, telefone e e-mail — sem alteração de layout
- Agora vai exibir o e-mail da coluna `customers.email` em vez de só do profiles

### 6. Telegram

- Incluir nome do motorista na mensagem: "🚗 Motorista: {driver_name}"
- Manter os campos de passageiro (nome, telefone) — aparecerão quando/se a API passar a retornar

