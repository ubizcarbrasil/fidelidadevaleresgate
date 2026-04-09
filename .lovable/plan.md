

# Plano: Conectar evento DUEL_CHALLENGE_RECEIVED ao sistema de fluxos de mensagens

## O que será feito

Quando um motorista for desafiado para um duelo, além da notificação in-app existente, o sistema disparará automaticamente a edge function `send-driver-message` para enviar a mensagem personalizada via TaxiMachine usando o template "Desafio de Duelo" e o fluxo configurado.

## Duas etapas

### 1. Modificar `servico_notificacoes_duelo.ts` — adicionar disparo do fluxo de mensagem

Após enviar a notificação in-app via `send-push-notification`, disparar também `send-driver-message` com o `event_type` correspondente. Isso permite que o sistema de fluxos resolva automaticamente o template e a audiência configurados.

A função `enviarNotificacaoDuelo` receberá dois novos parâmetros opcionais: `brandId` e `branchId`. Quando presentes e o tipo do evento tiver um mapeamento para o sistema de fluxos, será feita uma chamada adicional a `send-driver-message` com:
- `brand_id`, `branch_id`
- `event_type` mapeado (ex: `DUEL_CHALLENGE_RECEIVED`)
- `customer_ids` (os mesmos motoristas)
- `context_vars` com `adversario` (nomeOponente)

Mapeamento de tipos suportados inicialmente:
- `DUEL_CHALLENGE_RECEIVED` → evento `DUEL_CHALLENGE_RECEIVED`
- `DUEL_CHALLENGE_ACCEPTED` → `DUEL_ACCEPTED`
- `DUEL_CHALLENGE_DECLINED` → `DUEL_DECLINED`
- `DUEL_VICTORY` → `DUEL_VICTORY`
- `DUEL_FINISHED` → `DUEL_FINISHED`
- `BELT_NEW_CHAMPION` → `BELT_NEW_CHAMPION`

### 2. Atualizar `hook_duelos.ts` — passar `brandId` e `branchId` nas chamadas

As chamadas a `enviarNotificacaoDuelo` no hook de duelos já têm acesso ao `brandId` e `branchId` do contexto. Adicionar esses parâmetros nas chamadas existentes para ativar o disparo automático do fluxo.

## Arquivos modificados

1. `src/components/driver/duels/servico_notificacoes_duelo.ts` — adicionar lógica de disparo do fluxo
2. `src/components/driver/duels/hook_duelos.ts` — passar brandId/branchId nas chamadas de notificação

## Resultado

Com o fluxo ativo no banco (event_type=DUEL_CHALLENGE_RECEIVED, template=Desafio de Duelo), quando um motorista criar um duelo, o desafiado receberá automaticamente a mensagem personalizada via TaxiMachine com as variáveis `{{nome}}` e `{{adversario}}` substituídas.

