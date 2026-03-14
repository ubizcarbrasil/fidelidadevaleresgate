

## Manter ambos endpoints TaxiMachine com fallback

### Análise da documentação confirmada

**Endpoint 1 — Recibo (atual, já implementado)**
- URL: `GET /api/integracao/recibo?id_mch={id}`
- Header: `api-key: {{api-key}}`
- Dados do passageiro: `response.cliente.nome`, `response.cliente.cpf` (sem telefone do passageiro)
- Valor: `response.dados_solicitacao.valor`
- Motorista: `response.condutor.nome`, `response.condutor.telefone`

**Endpoint 2 — Request (novo, documentação fornecida)**
- URL: `GET /api/v1/request/{id}`
- Header: `api-key: {{api-key}}`
- Dados do passageiro: `stops[0].client.name`, `stops[0].client.phone` (tem telefone!)
- Valor: `finished.final_value`
- Motorista: `driver.name`, `driver.cpf`, `driver.phone`

### Observação importante

O endpoint de recibo **não retorna telefone do passageiro** (o `telefone` está no bloco `condutor`, que é o motorista). Já o endpoint `/api/v1/request/:id` retorna `stops[].client.phone`. Usar ambos permite enriquecer os dados do passageiro.

### Estratégia: Recibo primeiro, Request como fallback + enriquecimento

1. Tentar `/api/integracao/recibo` primeiro (endpoint atual, já funciona)
2. Se falhar (401, 400, etc.), tentar `/api/v1/request/{id}` como fallback
3. Se o recibo retornar mas sem telefone do passageiro, fazer chamada adicional ao `/api/v1/request/{id}` para buscar o telefone

### Arquivos alterados

1. **`supabase/functions/machine-webhook/index.ts`** — função `processFinalized`:
   - Extrair a lógica de fetch em uma função `fetchRideData()` que tenta recibo primeiro, depois v1/request como fallback
   - Normalizar os dois formatos de resposta em um objeto unificado `{ rideValue, passengerName, passengerCpf, passengerPhone, driverName }`

2. **`supabase/functions/retry-failed-rides/index.ts`** — função `retryRide`:
   - Mesma lógica de fallback duplo

3. **`supabase/functions/test-machine-credentials/index.ts`**:
   - Testar **ambos** endpoints e reportar o resultado de cada um separadamente
   - Mostrar qual endpoint funciona e qual falha, para facilitar diagnóstico

### Formato unificado de resposta (interno)

```text
fetchRideData(headers, machineRideId) → {
  source: "recibo" | "request_v1",
  rideValue: number,
  passengerName: string | null,
  passengerCpf: string | null,
  passengerPhone: string | null,
  driverName: string | null,
}
```

### Parsing por endpoint

```text
RECIBO (/api/integracao/recibo):
  rideValue       ← response.dados_solicitacao.valor
  passengerName   ← response.cliente.nome
  passengerCpf    ← response.cliente.cpf
  passengerPhone  ← null (não disponível)
  driverName      ← response.condutor.nome

REQUEST V1 (/api/v1/request/:id):
  rideValue       ← finished.final_value
  passengerName   ← stops[0].client.name
  passengerCpf    ← null (não disponível)
  passengerPhone  ← stops[0].client.phone
  driverName      ← driver.name
```

### Resultado no teste de credenciais

O botão "Testar Credenciais" passará a mostrar:
- ✅ Endpoint Recibo: OK / ❌ Falhou (status X)
- ✅ Endpoint Request v1: OK / ❌ Falhou (status X)

Isso permite ao operador saber exatamente qual chave funciona com qual endpoint.

