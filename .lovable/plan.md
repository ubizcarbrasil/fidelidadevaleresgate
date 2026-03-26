

## Pontuar motorista com percentual dos pontos do passageiro

### Contexto
A API TaxiMachine já retorna `condutor.id` e `condutor.nome` no webhook de status. Com o `condutor.id`, podemos buscar CPF, telefone e email do motorista via `/api/integracao/condutor?id=X`. O motorista receberá um percentual configurável dos pontos que o passageiro recebeu.

### Alterações

**1. Banco de dados — `machine_integrations`**
- Adicionar coluna `driver_points_enabled` (boolean, default false)
- Adicionar coluna `driver_points_percent` (numeric, default 50) — percentual dos pontos do passageiro
- Adicionar coluna `driver_customer_tag` (text, default 'MOTORISTA') — tag para identificar o customer como motorista

**2. Edge Function `_shared/fetchRideData.ts`**
- Adicionar `driverId` (string | null) ao `RideData` — ID numérico do condutor na TaxiMachine
- Extrair `condutor.id` ou `driver.id` dos parsers (Recibo e V1)
- Criar função `fetchDriverDetails(driverId, headers)` que chama `/api/integracao/condutor?id=X` e retorna `{ cpf, phone, email, name }`

**3. Edge Function `machine-webhook/index.ts` — `processFinalized`**
- Após pontuar o passageiro, verificar se `integration.driver_points_enabled === true`
- Se sim, usar o `driverId` retornado pelo fetch para buscar dados completos do motorista via `fetchDriverDetails`
- Buscar/criar customer para o motorista usando cascata: CPF → telefone → nome (igual ao passageiro), com tag `[MOTORISTA]` no nome
- Calcular pontos do motorista: `Math.floor(passengerPoints * (integration.driver_points_percent / 100))`
- Inserir no `points_ledger` com reason "Corrida TaxiMachine #X - Motorista (Y% de Z pts)"
- Atualizar `points_balance` e `ride_count` do customer-motorista
- Espelhar para `crm_contacts` com source `MOBILITY_DRIVER`
- Registrar `driver_points_credited` e `driver_customer_id` no upsert de `machine_rides`

**4. Banco de dados — `machine_rides`**
- Adicionar coluna `driver_points_credited` (integer, default 0)
- Adicionar coluna `driver_customer_id` (uuid, nullable)
- Adicionar coluna `driver_id` (text, nullable) — ID do condutor na TaxiMachine

**5. UI — `MachineIntegrationPage.tsx`**
- Adicionar seção "Pontuação do Motorista" na configuração da integração
- Toggle para habilitar/desabilitar
- Campo numérico para o percentual (1-100, default 50)
- Texto explicativo: "O motorista receberá X% dos pontos creditados ao passageiro"

### Fluxo resumido

```text
Webhook F (finalizada)
  → Fetch dados da corrida (Recibo/V1)
  → Pontuar passageiro (fluxo atual)
  → Se driver_points_enabled:
    → Extrair condutor.id do payload/fetch
    → GET /api/integracao/condutor?id=X → CPF, telefone, email
    → Buscar/criar customer-motorista por CPF/telefone/nome
    → Creditar Math.floor(pontosPassageiro × percent/100)
    → Ledger + balance + crm_contacts
```

### O que NÃO muda
- Fluxo de pontuação do passageiro (inalterado)
- Regras de tier, limites anti-fraude
- Webhook payload — apenas consumimos dados já disponíveis
- RLS, auth, guards

