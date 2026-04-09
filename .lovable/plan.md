

# Plano: Notificações automáticas para apostas laterais via TaxiMachine

## O que será feito

Quando um motorista criar ou aceitar uma aposta lateral em um duelo, o sistema enviará automaticamente notificações in-app e via TaxiMachine para os motoristas envolvidos.

## Mudanças

### 1. Adicionar tipos de notificação de aposta no serviço de notificações

**Arquivo**: `src/components/driver/duels/servico_notificacoes_duelo.ts`

- Adicionar dois novos tipos ao `TipoNotificacaoDuelo`: `SIDE_BET_CREATED` e `SIDE_BET_ACCEPTED`
- Adicionar mapeamento no `MAPEAMENTO` com títulos/corpos em português:
  - `SIDE_BET_CREATED`: "Nova aposta no seu duelo! 🎯" / "Alguém apostou {pontos} pts em {nome}"
  - `SIDE_BET_ACCEPTED`: "Aposta aceita! 💰" / "Sua aposta foi aceita. Pontos reservados!"
- Adicionar `reference_type` correspondentes: `side_bet_created`, `side_bet_accepted`
- Adicionar mapeamento no `MAPEAMENTO_FLUXO` para disparo via TaxiMachine: `SIDE_BET_CREATED` e `SIDE_BET_ACCEPTED`

### 2. Adicionar mapeamento na edge function send-push-notification

**Arquivo**: `supabase/functions/send-push-notification/index.ts`

- Adicionar ao `REFERENCE_TO_EVENT_TYPE`:
  - `side_bet_created` → `SIDE_BET_CREATED`
  - `side_bet_accepted` → `SIDE_BET_ACCEPTED`

### 3. Disparar notificações nos hooks de apostas

**Arquivo**: `src/components/driver/duels/hook_apostas_duelo.ts`

- Modificar `useCreateSideBet` e `useAcceptSideBet` para receber `brandId`, `branchId` e `nomeApostador` nos parâmetros da mutation
- No `onSuccess` de `useCreateSideBet`: chamar `enviarNotificacaoDuelo` com tipo `SIDE_BET_CREATED`, notificando os participantes do duelo (challenger e challenged customer IDs)
- No `onSuccess` de `useAcceptSideBet`: chamar `enviarNotificacaoDuelo` com tipo `SIDE_BET_ACCEPTED`, notificando o criador da aposta (bettor_a)
- Adicionar parâmetros extras: `challengerCustomerId`, `challengedCustomerId`, `bettorACustomerId` para saber quem notificar

### 4. Atualizar componentes para passar os novos parâmetros

**Arquivos**: `CriarApostaSheet.tsx` e `ApostaAbertaCard.tsx`

- Passar `brandId`, `branchId` e nomes dos envolvidos nas chamadas de `createBet.mutateAsync` e `acceptBet.mutateAsync`
- Obter `brand_id` e `branch_id` do contexto do driver session

## Resultado

Ao criar uma aposta lateral, os dois duelistas serão notificados de que alguém apostou no duelo deles. Ao aceitar uma aposta, o criador original será notificado. Ambas as notificações serão enviadas in-app e via TaxiMachine (se houver fluxo configurado).

