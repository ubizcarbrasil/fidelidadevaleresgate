

## Contagem de corridas em tempo real para duelos ativos

### Problema
Os duelos ao vivo e aceitos mostram `0 × 0` corridas porque os campos `challenger_rides_count` e `challenged_rides_count` na tabela `driver_duels` só são preenchidos no momento da **finalização** (via `finalize_duel`). Durante o duelo, esses campos permanecem zerados.

### Solução
Criar um hook que consulta a RPC `count_duel_rides` periodicamente (polling) para duelos ativos e usar esses valores em tempo real no lugar dos valores armazenados.

### Plano

**1. Criar hook `useContagemCorridasDuelo` em `hook_duelos.ts`**
- Para duelos com status `live` ou `accepted`, consultar `count_duel_rides` para cada participante usando `start_at`, `end_at` e `branch_id`
- Polling a cada 30 segundos via `refetchInterval`
- Retornar `{ challengerRides, challengedRides, isLoading }`
- Obter `customer_id` de cada participante via dados já carregados no duelo

**2. Atualizar `DuelDetailSheet.tsx`**
- Usar `useContagemCorridasDuelo` para duelos `live`/`accepted`
- Exibir os valores em tempo real no placar principal em vez de `duel.challenger_rides_count`
- Manter `duel.*_rides_count` para duelos `finished`

**3. Atualizar `DuelCard.tsx`**
- Usar o mesmo hook para mostrar placar real nos cards de duelos ativos na lista

**4. Atualizar `CardDuelosAoVivo.tsx` e `BannerDueloAoVivo.tsx`**
- Substituir `destaque.challenger_rides_count` pelo valor em tempo real nos componentes do dashboard

### Arquivos
- **Editar**: `src/components/driver/duels/hook_duelos.ts` — novo hook `useContagemCorridasDuelo`
- **Editar**: `src/components/driver/duels/DuelDetailSheet.tsx` — usar contagem real para duelos ativos
- **Editar**: `src/components/driver/duels/DuelCard.tsx` — usar contagem real
- **Editar**: `src/components/driver/duels/dashboard/CardDuelosAoVivo.tsx` — usar contagem real
- **Editar**: `src/components/driver/duels/BannerDueloAoVivo.tsx` — usar contagem real

