

## Correção: Motoristas não pontuados em algumas corridas

### Diagnóstico

Analisando o webhook `machine-webhook/index.ts`, identifiquei **duas causas raiz** para motoristas não serem pontuados:

**Causa 1 — Linha 467**: O bloco de pontuação do motorista está condicionado a `pointsCredited && points > 0`:
```typescript
if (pointsCredited && points > 0 && integration.driver_points_enabled && driverId) {
```
Se o passageiro não for pontuado (ex: falha ao criar customer, pontos = 0), o motorista é **completamente ignorado**, mesmo que o driverId exista.

**Causa 2 — `driverId` nulo**: Se nem a API (recibo/V1) nem o payload (`links.driver`) retornam o ID do motorista, o bloco inteiro é pulado — mesmo quando o `driverName` está disponível nos dados da corrida.

### Plano de Correção

#### 1. Desacoplar pontuação do motorista da do passageiro

Mover a condição de entrada do bloco de driver scoring para depender apenas de:
- `integration.driver_points_enabled` 
- `driverId` OU `driverName` disponível
- `rideValue > 0`

Remover a dependência de `pointsCredited && points > 0`. O motorista deve ser pontuado independentemente do resultado do passageiro.

Para regras do tipo `PERCENT` (percentual dos pontos do passageiro), usar os pontos calculados do passageiro como referência mesmo que o passageiro não tenha sido creditado (calcular sem creditar).

#### 2. Fallback por nome quando driverId é nulo

Quando `driverId` é null mas `driverName` está presente:
- Buscar motorista existente por nome com tag `[MOTORISTA]` no `customers`
- Se não encontrar, criar o registro normalmente com todos os dados disponíveis (sem `external_driver_id`)
- Logar warning para rastreabilidade

#### 3. Garantir dados completos no cadastro do motorista

O cadastro atual (linhas 569-586) já inclui CPF, phone via `fetchDriverDetails`. Adicionar:
- `email` do motorista (já retornado por `fetchDriverDetails` mas não salvo no customer)
- Salvar o email no campo apropriado ou no CRM contact

#### Arquivo afetado

| Arquivo | Alteração |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Desacoplar guard condition do driver scoring, adicionar fallback por nome, incluir email no cadastro |

### Detalhes técnicos

```typescript
// ANTES (linha 467):
if (pointsCredited && points > 0 && integration.driver_points_enabled && driverId) {

// DEPOIS:
if (integration.driver_points_enabled && rideValue > 0 && (driverId || driverName)) {
  // Para regras PERCENT, calcular pontos de referência do passageiro
  const passengerPointsRef = points > 0 ? points : Math.floor(rideValue * resolvedPointsPerReal);
  // ... usar passengerPointsRef no lugar de `points` para cálculo PERCENT
```

Para o fallback por nome (quando `driverId` é null):
```typescript
// Após falhar a busca por external_driver_id e cascade CPF/phone/name
if (!driverCascade && !driverId && driverName) {
  // Buscar por nome tagado
  const taggedName = `[${driverTag}] ${driverName}`;
  const { data } = await sb.from("customers").select(...)
    .eq("brand_id", brandId).eq("name", taggedName).maybeSingle();
  if (data) driverCascade = { customer: data, matchedBy: "name_fallback" };
}
```

Também preciso salvar o `pointsPerReal` resolvido em uma variável acessível ao bloco do motorista (atualmente fica dentro do escopo `if (customer)`).

