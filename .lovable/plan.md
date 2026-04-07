
## Corrigir nomes e fotos nos cards e detalhes de duelos

### Problema
Todos os cards de duelo (lista "Aguardando Resposta", "Ao Vivo na cidade", detalhe do duelo) mostram "Motorista" porque usam `cleanDriverName((duel.challenger as any)?.customers?.name)`, que depende do join com `customers` — bloqueado por RLS.

Os dados corretos já estão disponíveis na query: `challenger.display_name`, `challenger.public_nickname` e `challenger.avatar_url` vêm da tabela `driver_duel_participants` (que o select `*` já traz).

### Solução
Criar uma função helper centralizada que resolve o nome a partir do participante do duelo, priorizando: `public_nickname` > `display_name` > `customers.name` (fallback). Usar `avatar_url` do participante para mostrar foto.

### Arquivos a editar

**1. `hook_duelos.ts`** — Nova helper `resolveParticipantName(participant)`
```ts
export function resolveParticipantName(p: any): string {
  return p?.public_nickname || p?.display_name || cleanDriverName(p?.customers?.name);
}
export function resolveParticipantAvatar(p: any): string | null {
  return p?.avatar_url || null;
}
```

**2. `DuelCard.tsx`** — Usar `resolveParticipantName` e mostrar avatar do oponente

**3. `DuelDetailSheet.tsx`** — Usar helpers para challengerName/challengedName + mostrar avatares no placar

**4. `CardDueloPublico.tsx`** — Usar helpers + mostrar `avatar_url` no `AvatarMini`

**5. `DuelChallengeCard.tsx`** — Usar helpers para nome do desafiante

**6. `NegociacaoContrapropostaCard.tsx`** — Usar helpers para nome do oponente

### Resultado
Todos os cards e telas de duelo mostrarão o apelido ou nome real do motorista (nunca "Motorista") e a foto de perfil quando disponível.
