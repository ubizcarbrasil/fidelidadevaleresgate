

## Problema encontrado: o botão "Identificar" está quebrado

Investiguei o banco de dados e o código. O sistema **já tem** o botão "Identificar" nas Últimas Pontuações, mas ele **não funciona** por causa de colunas faltando:

### Bugs atuais

1. **`machine_rides`** não tem colunas `passenger_name` nem `passenger_phone` — o dialog tenta fazer `UPDATE` nessas colunas que não existem, falhando silenciosamente
2. **`machine_ride_notifications`** não tem `customer_id` — o dialog verifica `identifyNotif.customer_id` que é sempre `undefined`, então o registro do **cliente nunca é atualizado**
3. Resultado: ao clicar "Salvar identificação", **apenas a notificação visual é atualizada** (local state), mas os dados **não são persistidos** no cliente

### Dados atuais no banco
- Todos os 51+ clientes: `name = "Passageiro corrida #675..."`, `cpf = null`, `phone = null`, `email = null`
- Todas as notificações: `customer_name = null`, `customer_phone = null`, `customer_cpf_masked = null`

### Plano de correção

#### 1. Migração: adicionar colunas faltando
- `machine_rides`: adicionar `passenger_name` (text) e `passenger_phone` (text)
- `machine_ride_notifications`: adicionar `customer_id` (uuid, FK → customers)

#### 2. Webhook: salvar `customer_id` na notificação
- Atualizar `machine-webhook` e `retry-failed-rides` para gravar `customer_id` junto com a notificação

#### 3. Corrigir dialog "Identificar" 
- Quando `customer_id` não existir na notificação, buscar o cliente via `points_ledger` (que já liga `customer_id` ao `machine_ride_id` pelo campo `reason`)
- Garantir que o `UPDATE` no `customers` funcione corretamente

#### 4. Resultados nas 4 telas
- **Últimas pontuações**: após identificar, nome/CPF/telefone aparecem imediatamente e são persistidos
- **Clientes pontuados**: já funciona — vai mostrar o nome atualizado do customer
- **Página de Clientes**: já funciona — mostra nome atualizado
- **Telegram**: já funciona — próximas corridas do mesmo cliente mostrarão o nome correto (match por CPF/telefone)

