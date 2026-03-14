# Fluxo de Integração TaxiMachine → Pontuação

Documento técnico que descreve o caminho completo desde o recebimento do webhook da TaxiMachine até o crédito de pontos ao cliente.

---

## Diagrama do Fluxo

```
TaxiMachine                    machine-webhook                  API TaxiMachine
    │                               │                                │
    │  POST /machine-webhook        │                                │
    │  { request_id, status_code }  │                                │
    │──────────────────────────────>│                                │
    │                               │                                │
    │                               │  1. Localiza integração        │
    │                               │     (x-api-secret / brand_id)  │
    │                               │                                │
    │                               │  2. Registra evento            │
    │                               │     → machine_ride_events      │
    │                               │                                │
    │                               │  status_code != "F" ?          │
    │                               │  ├─ SIM → upsert ride status   │
    │                               │  │        e retorna 200        │
    │                               │  └─ NÃO (F = Finalizada) ↓    │
    │                               │                                │
    │                               │  3. Anti-duplicação            │
    │                               │     ride já FINALIZED? → skip  │
    │                               │                                │
    │                               │  4. Busca dados da corrida     │
    │                               │────────────────────────────────>│
    │                               │  GET /api/integracao/recibo    │
    │                               │      ?id_mch={request_id}      │
    │                               │<────────────────────────────────│
    │                               │  { valor, CPF, nome }          │
    │                               │                                │
    │                               │  (se falta telefone)           │
    │                               │────────────────────────────────>│
    │                               │  GET /api/v1/request/{id}      │
    │                               │<────────────────────────────────│
    │                               │  { phone, name }               │
    │                               │                                │
    │                               │  5. Busca cliente (cascade)    │
    │                               │     CPF → Phone → Nome         │
    │                               │                                │
    │                               │  6. Cria cliente (se novo)     │
    │                               │                                │
    │                               │  7. Credita pontos             │
    │                               │     → points_ledger (CREDIT)   │
    │                               │     → customers.points_balance │
    │                               │                                │
    │                               │  8. Persiste corrida           │
    │                               │     → machine_rides (FINALIZED)│
    │                               │                                │
    │  200 OK                       │                                │
    │<──────────────────────────────│                                │
```

---

## 1. Webhook Recebido

**Endpoint:** `POST /functions/v1/machine-webhook`

### Payload de Entrada

```json
{
  "request_id": "100012345",
  "status_code": "F"
}
```

| Campo         | Tipo   | Descrição                                          |
|---------------|--------|----------------------------------------------------|
| `request_id`  | string | ID da corrida na TaxiMachine                       |
| `status_code` | string | Status: `P` (Pendente), `A` (Aceita), `S` (Em andamento), `F` (Finalizada), `C` (Cancelada), `N` (Negada) |

### Mapeamento de Status

| Código | Status Interno   |
|--------|------------------|
| `P`    | PENDING          |
| `A`    | ACCEPTED         |
| `S`    | IN_PROGRESS      |
| `F`    | FINALIZED        |
| `C`    | CANCELLED        |
| `N`    | DENIED           |

### Identificação da Integração (cascade)

A integração é localizada na tabela `machine_integrations` nesta ordem:

1. **Header `x-api-secret`** → busca por `api_key` na tabela
2. **`brand_id` + `branch_id`** (body ou query string) → busca por ambos
3. **`brand_id` apenas** → primeira integração ativa da marca
4. **Fallback legado** → se existe apenas uma integração ativa global

---

## 2. Consulta ao Recibo (Endpoint Primário)

Quando `status_code = "F"`, o sistema consulta a API da TaxiMachine para obter os dados financeiros da corrida.

**URL:** `GET https://api.taximachine.com.br/api/integracao/recibo?id_mch={request_id}`

### Headers Enviados

```
api-key: {receipt_api_key}
User-Agent: ua-ubizcar
Authorization: Basic {base64(user:password)}   ← opcional
```

| Header          | Origem                                         | Obrigatório |
|-----------------|-------------------------------------------------|-------------|
| `api-key`       | `machine_integrations.receipt_api_key` (ou fallback `api_key`) | ✅ Sim      |
| `User-Agent`    | Fixo `ua-ubizcar`                               | ✅ Sim      |
| `Authorization` | Basic Auth com `basic_auth_user:basic_auth_password` | ❌ Não      |

### Resposta Esperada (sucesso)

```json
{
  "response": {
    "dados_solicitacao": {
      "valor": 45.50
    },
    "cliente": {
      "nome": "João da Silva",
      "cpf": "12345678900"
    },
    "condutor": {
      "nome": "Carlos Motorista"
    }
  }
}
```

### Campos Extraídos

| Campo           | Caminho no JSON                     | Tratamento                    |
|-----------------|-------------------------------------|-------------------------------|
| `rideValue`     | `response.dados_solicitacao.valor`  | Convertido para número        |
| `passengerName` | `response.cliente.nome`             | Null se ausente               |
| `passengerCpf`  | `response.cliente.cpf`              | Remove caracteres não-numéricos |
| `driverName`    | `response.condutor.nome`            | Null se ausente               |
| `passengerPhone`| ❌ **Não disponível neste endpoint** | Sempre null                   |

---

## 3. Enriquecimento via Request V1

Se o endpoint Recibo **não retorna o telefone do passageiro** (sempre o caso), o sistema tenta enriquecer com o endpoint V1.

**URL:** `GET https://api.taximachine.com.br/api/v1/request/{request_id}`

### Headers

Mesmos headers do Recibo (`api-key`, `User-Agent`, `Authorization` opcional).

### Resposta Esperada

```json
{
  "stops": [
    {
      "client": {
        "name": "João da Silva",
        "phone": "11999887766"
      }
    }
  ],
  "driver": {
    "name": "Carlos Motorista"
  },
  "finished": {
    "final_value": 45.50
  }
}
```

### Campos Extraídos

| Campo           | Caminho no JSON          | Tratamento          |
|-----------------|--------------------------|---------------------|
| `rideValue`     | `finished.final_value`   | Convertido p/ número|
| `passengerName` | `stops[0].client.name`   | Null se ausente     |
| `passengerPhone`| `stops[0].client.phone`  | Null se ausente     |
| `driverName`    | `driver.name`            | Null se ausente     |
| `passengerCpf`  | ❌ **Não disponível**     | Sempre null         |

### Lógica de Combinação

| Cenário                           | `source` resultante |
|-----------------------------------|---------------------|
| Recibo OK, sem enriquecimento     | `recibo`            |
| Recibo OK + telefone do V1        | `recibo+v1`         |
| Recibo falhou, V1 OK              | `request_v1`        |
| V1 OK + CPF do Recibo             | `recibo+v1`         |
| Ambos falharam                    | ❌ Erro registrado   |

### Endpoint Preferencial

O campo `machine_integrations.preferred_endpoint` define qual endpoint é tentado primeiro:
- `"recibo"` (padrão) — tenta Recibo primeiro, fallback para V1
- `"request_v1"` — tenta V1 primeiro, fallback para Recibo

---

## 4. Busca do Cliente (Cascade)

O sistema busca o cliente na tabela `customers` usando três critérios em sequência:

```
┌─────────────────────────────────────────┐
│  1. Busca por CPF                       │
│     customers.cpf = passengerCpf        │
│     customers.brand_id = brandId        │
│     customers.is_active = true          │
│     ↓ encontrou? → matchedBy = "cpf"    │
├─────────────────────────────────────────┤
│  2. Busca por Telefone                  │
│     customers.phone = passengerPhone    │
│     customers.brand_id = brandId        │
│     customers.is_active = true          │
│     ↓ encontrou? → matchedBy = "phone"  │
├─────────────────────────────────────────┤
│  3. Busca por Nome Exato                │
│     customers.name = passengerName      │
│     customers.brand_id = brandId        │
│     customers.is_active = true          │
│     ↓ encontrou? → matchedBy = "name"   │
├─────────────────────────────────────────┤
│  Nenhum encontrado → customer = null    │
└─────────────────────────────────────────┘
```

**Importante:** Cada busca usa `LIMIT 1` e `.maybeSingle()`. A busca para no primeiro match.

---

## 5. Criação Automática de Cliente

Se nenhum cliente foi encontrado e existe um `branch_id` válido:

```sql
INSERT INTO customers (brand_id, branch_id, cpf, phone, name, points_balance, money_balance)
VALUES ({brandId}, {branchId}, {cpf}, {phone}, {displayName}, 0, 0)
```

### Nome do Cliente (displayName)

| Dados Disponíveis | Nome Gerado                            |
|--------------------|----------------------------------------|
| Nome do passageiro | `"João da Silva"`                      |
| Apenas CPF         | `"Passageiro •••8900"`                 |
| Nenhum             | `"Passageiro corrida #100012345"`      |

---

## 6. Crédito de Pontos

Se o cliente foi encontrado/criado e `rideValue > 0`:

### 6.1 Inserção no Ledger

```sql
INSERT INTO points_ledger (brand_id, branch_id, customer_id, entry_type, points_amount, money_amount, reason, reference_type)
VALUES (
  {brandId},
  {customer.branch_id},
  {customer.id},
  'CREDIT',
  FLOOR(rideValue),        -- ex: 45 pontos para R$ 45.50
  {rideValue},             -- R$ 45.50
  'Corrida TaxiMachine #100012345 - R$ 45.50',
  'MACHINE_RIDE'
)
```

### 6.2 Atualização do Saldo

```sql
UPDATE customers
SET points_balance = points_balance + FLOOR(rideValue)
WHERE id = {customer.id}
```

### Regra de Conversão

```
1 real gasto = 1 ponto creditado (arredondado para baixo)
R$ 45.50 → 45 pontos
```

---

## 7. Persistência e Notificações

### 7.1 Registro da Corrida

```sql
UPSERT machine_rides (brand_id, machine_ride_id)
SET ride_status = 'FINALIZED',
    ride_value = {rideValue},
    points_credited = {points},
    passenger_cpf = {cpf},
    finalized_at = NOW()
```

### 7.2 Contadores da Integração

```sql
UPDATE machine_integrations
SET total_rides = total_rides + 1,
    total_points = total_points + {points},
    last_ride_processed_at = NOW()
WHERE id = {integration.id}
```

### 7.3 Notificação Realtime

Se pontos foram creditados, insere em `machine_ride_notifications` para atualização do dashboard em tempo real.

### 7.4 Notificação Telegram

Se `machine_integrations.telegram_chat_id` está configurado, dispara notificação via edge function `send-telegram-ride-notification` (fire-and-forget).

### 7.5 Callback URL

Se `machine_integrations.callback_url` está configurado, envia POST com dados da corrida processada (fire-and-forget, timeout 5s).

---

## 8. Cenários de Erro

| Status Registrado      | Causa                                             | Retriável? |
|------------------------|---------------------------------------------------|------------|
| `CREDENTIAL_ERROR`     | `receipt_api_key` ausente ou inválida (401)        | ✅ Sim      |
| `API_ERROR`            | API TaxiMachine indisponível ou erro 5xx           | ✅ Sim      |
| `NO_VALUE`             | Corrida com valor R$ 0.00                          | ❌ Não      |
| `FINALIZED`            | Processado com sucesso                             | ❌ (duplicação bloqueada) |

Corridas com `API_ERROR` ou `CREDENTIAL_ERROR` podem ser reprocessadas via `retry-failed-rides`.

---

## 9. Tabelas Envolvidas

| Tabela                       | Operação | Descrição                              |
|------------------------------|----------|----------------------------------------|
| `machine_integrations`       | SELECT   | Configuração e credenciais             |
| `machine_ride_events`        | INSERT   | Log de cada webhook recebido           |
| `machine_rides`              | UPSERT   | Estado e resultado de cada corrida     |
| `customers`                  | SELECT/INSERT | Busca ou criação do passageiro    |
| `points_ledger`              | INSERT   | Registro do crédito de pontos          |
| `machine_ride_notifications` | INSERT   | Feed realtime do dashboard             |
| `audit_logs`                 | INSERT   | Auditoria de cada ação                 |

---

## 10. Arquivos Relacionados

| Arquivo                                        | Responsabilidade                          |
|------------------------------------------------|-------------------------------------------|
| `supabase/functions/machine-webhook/index.ts`  | Webhook principal, orquestração do fluxo  |
| `supabase/functions/_shared/fetchRideData.ts`  | Fetch dual-endpoint (Recibo + V1)         |
| `supabase/functions/retry-failed-rides/index.ts` | Reprocessamento de corridas com erro    |
| `supabase/functions/test-machine-credentials/index.ts` | Teste de credenciais              |
| `src/pages/MachineIntegrationPage.tsx`         | UI de configuração da integração          |
