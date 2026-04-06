

## Etapa 7 — Notificações e Engajamento do Módulo de Duelos

### Resumo
Criar a infraestrutura de notificações internas para todos os eventos do módulo de duelos, usando a tabela `customer_notifications` já existente e a edge function `send-push-notification` já disponível. O trabalho consiste em: (1) definir os tipos de evento no EventBus, (2) criar um hook que escuta esses eventos e dispara notificações via edge function, (3) integrar os disparos nos pontos corretos do código existente (RPCs e hooks).

---

### 1. Tipos de evento no EventBus

**Arquivo modificado: `src/lib/eventBus.ts`**

Adicionar 10 novos eventos ao `AppEvents`:

```ts
DUEL_CHALLENGE_RECEIVED: { brandId: string; challengedCustomerId: string; challengerName: string; duelId: string };
DUEL_CHALLENGE_ACCEPTED: { brandId: string; challengerCustomerId: string; challengedName: string; duelId: string };
DUEL_CHALLENGE_DECLINED: { brandId: string; challengerCustomerId: string; challengedName: string; duelId: string };
DUEL_STARTED: { brandId: string; customerIds: string[]; duelId: string };
DUEL_LEAD_CHANGE: { brandId: string; trailingCustomerId: string; leaderName: string; duelId: string };
DUEL_FINISHED: { brandId: string; customerIds: string[]; duelId: string; winnerId: string | null };
DUEL_VICTORY: { brandId: string; winnerCustomerId: string; opponentName: string; duelId: string };
DUEL_DEFEAT: { brandId: string; loserCustomerId: string; opponentName: string; duelId: string };
RANKING_TOP10_ENTRY: { brandId: string; customerId: string; position: number };
BELT_NEW_CHAMPION: { brandId: string; championCustomerId: string; branchId: string; record: number };
```

---

### 2. Serviço de disparo de notificações de duelo

**Novo arquivo: `src/components/driver/duels/servico_notificacoes_duelo.ts`**

Função utilitária `enviarNotificacaoDuelo` que chama a edge function `send-push-notification` com os parâmetros corretos para cada tipo de evento. Mapeamento interno de evento → título/body em português.

Exemplo de mapeamento:
- `DUEL_CHALLENGE_RECEIVED` → título: "Você recebeu um desafio! 🥊", body: "{nome} quer te desafiar"
- `DUEL_CHALLENGE_ACCEPTED` → título: "Desafio aceito! 💪", body: "{nome} aceitou seu desafio"
- `DUEL_CHALLENGE_DECLINED` → título: "Desafio recusado 😅", body: "{nome} arregou do seu desafio"
- `DUEL_FINISHED` → título: "Duelo encerrado! 🏁"
- `DUEL_VICTORY` → título: "Você venceu! 🏆"
- `DUEL_DEFEAT` → título: "Derrota no duelo 😤", body: "Mas a próxima é sua!"
- `BELT_NEW_CHAMPION` → título: "Novo dono do cinturão! 👑"

---

### 3. Integração nos hooks existentes

**Arquivo modificado: `src/components/driver/duels/hook_duelos.ts`**

Nos callbacks `onSuccess` das mutations existentes, emitir os eventos correspondentes via `eventBus.emit()`:

- `useCreateDuel` → emitir `DUEL_CHALLENGE_RECEIVED` + chamar `enviarNotificacaoDuelo` para o adversário
- `useRespondDuel` → emitir `DUEL_CHALLENGE_ACCEPTED` ou `DUEL_CHALLENGE_DECLINED` + notificar o desafiante
- `useFinalizeDuel` → emitir `DUEL_FINISHED` + `DUEL_VICTORY`/`DUEL_DEFEAT` + notificar ambos

---

### 4. Hook de listener centralizado (extensibilidade futura)

**Novo arquivo: `src/components/driver/duels/hook_listener_notificacoes.ts`**

Hook `useListenerNotificacoesDuelo()` que registra listeners no EventBus para todos os eventos de duelo. Atualmente apenas loga no console (preparação para futuras ações como badges, animações, sons). Pode ser montado no