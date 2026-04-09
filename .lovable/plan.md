

# Verificação: Mensagens de apostas no painel do empreendedor

## Diagnóstico

O fluxo de notificações de apostas laterais está **parcialmente implementado**. A parte do motorista (app) está correta: ao criar ou aceitar uma aposta, o sistema dispara `enviarNotificacaoDuelo` com os tipos `SIDE_BET_CREATED` e `SIDE_BET_ACCEPTED`, que por sua vez chama a edge function `send-driver-message`.

Porém, no **painel do empreendedor** (aba Mensagens > Fluxos), os eventos de aposta **não aparecem como opções configuráveis**. O array `EVENT_TYPES` em `hook_message_flows.ts` não inclui `SIDE_BET_CREATED` nem `SIDE_BET_ACCEPTED`. Isso significa que o empreendedor **não consegue criar fluxos automáticos** para esses eventos — as mensagens simplesmente não serão enviadas via TaxiMachine mesmo que o disparo ocorra no código.

## Correções necessárias

### 1. Adicionar eventos de aposta na lista de fluxos configuráveis

**Arquivo**: `src/features/integracao_mobilidade/hooks/hook_message_flows.ts`

Incluir no array `EVENT_TYPES`:
- `{ value: "SIDE_BET_CREATED", label: "Aposta lateral criada", category: "bet" }`
- `{ value: "SIDE_BET_ACCEPTED", label: "Aposta lateral aceita", category: "bet" }`

### 2. Adicionar opções de audiência relevantes para apostas

**Arquivo**: `src/features/integracao_mobilidade/hooks/hook_message_flows.ts`

Incluir no array `AUDIENCE_OPTIONS`:
- `{ value: "bettor", label: "Apostador (criador)" }` — para notificar quem criou a aposta quando ela for aceita

### 3. Adicionar labels amigáveis no relatório de mensagens

**Arquivo**: `src/features/integracao_mobilidade/components/relatorio_mensagens.tsx`

Garantir que os event types `SIDE_BET_CREATED` e `SIDE_BET_ACCEPTED` apareçam com labels legíveis no gráfico de distribuição por evento (ex: "Aposta Criada", "Aposta Aceita") em vez do valor cru do enum.

## Resultado

O empreendedor poderá, no painel de Integração de Mobilidade > Mensagens > Fluxos:
1. Criar um fluxo automático para "Aposta lateral criada" — definindo o template e audiência
2. Criar um fluxo automático para "Aposta lateral aceita" — definindo o template e audiência
3. Visualizar no relatório as métricas de entrega dessas mensagens

