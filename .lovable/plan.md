

# Corrigir chamada do notify-driver-points no machine-webhook

## Diagnóstico

Após análise detalhada do código e dos logs:

1. **A chamada está presente** no código (linhas 891-917 do `machine-webhook/index.ts`)
2. **O check de `driver_message_enabled`** está correto — o campo é `true` no banco
3. **A URL está correta** (`notify-driver-points`)
4. **A função `notify-driver-points` está deployada** e responde (testado com curl)
5. **O bloco está dentro de `if (pointsCredited)`** (linha 804) — mas as notificações Telegram dentro do mesmo bloco funcionam, então o código entra nessa seção

**Causa raiz**: O `fetch` na linha 896 é fire-and-forget (sem `await`). No Deno Deploy, quando a response é enviada de volta ao caller, o isolate pode ser encerrado antes que fetches não-awaited completem. As notificações Telegram funcionam porque são chamadas antes (linhas 841/863) e o runtime tem mais tempo. A chamada do `notify-driver-points` é a última operação antes do `return`, então o isolate é destruído antes do fetch iniciar.

## Solução

Adicionar um **log de diagnóstico** antes da chamada e tornar o fetch **minimamente awaited** com timeout curto para garantir que a requisição é enviada antes do isolate encerrar. Não precisa esperar a resposta completa — apenas garantir que o request HTTP é disparado.

## Arquivo a Modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Adicionar log e usar `await fetch(...).then(r => r.text()).catch(...)` com AbortController de 5s para garantir disparo |

## Detalhamento

```typescript
// Linha 891-917: Substituir fire-and-forget por await com timeout
if (driverPointsCredited > 0 && driverId && driverCustomerId && integration.driver_message_enabled) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    logger.info("Dispatching notify-driver-points", {
      machineRideId, driverId, driverPointsCredited, driverCustomerId
    });

    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    
    const notifyRes = await fetch(`${supabaseUrl}/functions/v1/notify-driver-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        machine_ride_id: machineRideId,
        brand_id: brandId,
        branch_id: branchId,
        driver_customer_id: driverCustomerId,
        driver_id: driverId,
        driver_points_credited: driverPointsCredited,
        ride_value: rideValue,
        driver_name: driverName || null,
        finalized_at: new Date().toISOString(),
      }),
    });
    
    logger.info("notify-driver-points response", { status: notifyRes.status });
    await notifyRes.text(); // consume body
  } catch (e) {
    logger.error("notify-driver-points error", { error: String(e) });
  }
}
```

Após a edição, re-deployar o `machine-webhook`.

**Estimativa**: 1 arquivo, ~30 linhas alteradas.

