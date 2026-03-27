

## Problema Identificado: Motoristas NÃO estão sendo pontuados

### Diagnóstico

Analisei corridas reais finalizadas no banco de dados. Resultado:

- Passageiros **estão sendo pontuados** corretamente (ex: 12-16 pontos por corrida)
- Motoristas **NÃO recebem pontos** em nenhuma corrida (`driver_points_credited = 0` em todas)
- `driver_id = NULL` em todas as corridas, mesmo com `driver_name` presente (ex: "Tatiane Maria De Souza", "Caio Cesar Ribeiro")

### Causa Raiz

O payload real do webhook TaxiMachine contém o ID do motorista na URL `links.driver`:

```text
"links": {
  "driver": "https://api.taximachine.com.br/api/integracao/condutor?id=1336570",
  "request": "..."
}
```

Mas o código **nunca extrai** esse valor do payload. O `driverId` só é obtido do retorno da API Recibo (`motoristaBlock.id`), e aparentemente a API não retorna esse campo consistentemente.

A condição para pontuar o motorista é:
```typescript
if (pointsCredited && points > 0 && integration.driver_points_enabled && driverId) {
```

Como `driverId` é sempre `null`, o bloco inteiro de pontuação do motorista **nunca executa**.

### Solução

#### Passo 1: Extrair `driverId` do payload do webhook

No `machine-webhook/index.ts`, na função `Deno.serve`, extrair o `driverId` de `body.links.driver` (parseando a URL para pegar o `id`) e passá-lo para `processFinalized`.

```typescript
// Extrair driver ID do payload
const driverLinkUrl = body?.links?.driver;
let payloadDriverId: string | null = null;
if (typeof driverLinkUrl === "string") {
  const match = driverLinkUrl.match(/[?&]id=(\d+)/);
  if (match) payloadDriverId = match[1];
}
```

#### Passo 2: Usar como fallback no `processFinalized`

Passar `payloadDriverId` para `processFinalized` e usá-lo como fallback quando o `driverId` retornado pela API for `null`:

```typescript
const effectiveDriverId = rideResult.data.driverId || payloadDriverId;
```

#### Passo 3: Também extrair `driverName` do payload do webhook

O payload do webhook para status "ACCEPTED" contém `links.driver` — o nome vem da API. Garantir que se o `driverId` do payload estiver disponível, as chamadas a `fetchDriverDetails` funcionem.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/machine-webhook/index.ts` | Extrair `driverId` de `body.links.driver`, passar para `processFinalized`, usar como fallback |

### Impacto

Após esta correção, **todas as corridas futuras** irão pontuar os motoristas automaticamente de acordo com as regras configuradas. As corridas passadas permanecerão sem pontuação (podem ser reprocessadas manualmente se necessário).

### Verificação

Após o deploy, a próxima corrida finalizada deve:
1. Extrair o `driverId` do link no payload
2. Buscar detalhes do motorista na API (`fetchDriverDetails`)
3. Criar ou encontrar o customer com tag `[MOTORISTA]`
4. Calcular pontos conforme a regra ativa (PERCENT 50% atualmente)
5. Creditar no `points_ledger`
6. Enviar notificação Telegram

