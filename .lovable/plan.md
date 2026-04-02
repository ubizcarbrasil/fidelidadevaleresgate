

# Edge Function "notify-driver-points"

## Resumo
Criar uma Edge Function que envia uma mensagem de notificação ao motorista via API TaxiMachine quando uma corrida é finalizada com pontos creditados. A function será chamada pelo `machine-webhook` existente (fire-and-forget), não por um database trigger.

## Por que não usar Database Trigger?
O Supabase Edge Functions não suporta triggers nativos via `pg_net` de forma confiável neste ambiente. A abordagem mais robusta é chamar a function de dentro do `machine-webhook` (que já processa as finalizações), similar ao padrão já usado para `send-telegram-ride-notification`.

## Implementação

### 1. Criar Edge Function `notify-driver-points`

**Arquivo:** `supabase/functions/notify-driver-points/index.ts`

Recebe via POST:
```json
{
  "machine_ride_id": "100012345",
  "brand_id": "uuid",
  "branch_id": "uuid",
  "driver_customer_id": "uuid",
  "driver_id": "12345",
  "driver_points_credited": 45,
  "ride_value": 45.50,
  "driver_name": "[MOTORISTA] João"
}
```

Lógica:
1. Validar payload (driver_points_credited > 0, driver_id presente)
2. Verificar duplicidade em `machine_ride_notifications` (busca por `machine_ride_id` + `brand_id`)
3. Buscar saldo atual do motorista em `customers` via `driver_customer_id`
4. Montar mensagem removendo prefixo "[MOTORISTA] " do nome
5. Enviar POST para `https://api-vendas.taximachine.com.br/api/integracao/enviarMensagem` com:
   - Header: `api-key: mch_api_cioWUFdOptZHBM64Zndt7Rma`
   - Body: `{ tipo_chat: "P", destinatario_id: parseInt(driver_id), mensagem: "..." }`
6. Em caso de sucesso: inserir registro em `machine_ride_notifications`
7. Em caso de erro: inserir em `error_logs` com source "notify-driver-points"

Modelo da mensagem:
> Oi {nome}! Você acaba de ganhar +{pontos_corrida} pontos pela corrida de R${valor}. Seu saldo agora é {saldo_total} pts. Continue acumulando para resgatar ofertas exclusivas!

### 2. Registrar no `config.toml`
Adicionar `[functions.notify-driver-points]` com `verify_jwt = false`.

### 3. Integrar no `machine-webhook`
Adicionar chamada fire-and-forget ao final do fluxo de finalização (similar ao padrão existente do Telegram), disparando `notify-driver-points` quando:
- `ride_status = 'FINALIZED'`
- `driver_id IS NOT NULL`
- `driver_points_credited > 0`

### 4. Guardar API key como secret
Armazenar `mch_api_cioWUFdOptZHBM64Zndt7Rma` como secret `TAXIMACHINE_MESSAGE_API_KEY` para não ficar hardcoded.

## Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/notify-driver-points/index.ts` | Criar |
| `supabase/config.toml` | Adicionar entry |
| `supabase/functions/machine-webhook/index.ts` | Adicionar chamada fire-and-forget |

## Controle de duplicidade
Usa a tabela `machine_ride_notifications` existente — verifica se já existe registro com mesmo `machine_ride_id` + `brand_id` antes de enviar. Campos preenchidos: `brand_id`, `branch_id`, `machine_ride_id`, `customer_name`, `driver_name`, `points_credited`, `ride_value`, `finalized_at`.

