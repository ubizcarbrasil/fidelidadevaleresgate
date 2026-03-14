

## Painel de Diagnóstico — Últimos 10 Eventos do Webhook

### O que será adicionado

Um novo Card na `MachineIntegrationPage` chamado **"Diagnóstico do Webhook"** que mostra os últimos 10 registros da tabela `machine_rides` com foco em erros e status problemáticos. Diferente do feed de eventos em tempo real (que mostra `machine_ride_events` brutos), este painel mostra o **resultado final** de cada corrida processada, incluindo erros como `API_ERROR`, `CREDENTIAL_ERROR` e `NO_VALUE`.

### Localização na UI

Será inserido **entre** o card "Últimas pontuações" e o card "Eventos em tempo real", visível quando houver integrações ativas.

### Conteúdo do painel

Cada linha mostrará:
- **Status** com badge colorido (FINALIZED = verde, API_ERROR / CREDENTIAL_ERROR = vermelho, NO_VALUE = amarelo, outros = cinza)
- **ID da corrida** (`machine_ride_id`)
- **Valor** e **pontos creditados** (se houver)
- **Data/hora** de criação e finalização
- Ícone de alerta para status de erro

### Implementação

1. **Nova query** (`useQuery`) buscando os últimos 10 registros de `machine_rides` filtrados por `brand_id`, ordenados por `created_at DESC`
2. **Novo Card** com `ScrollArea` renderizando as linhas com badges de status
3. **Mapa de status** com cores e labels em português para todos os status possíveis (`FINALIZED`, `API_ERROR`, `CREDENTIAL_ERROR`, `NO_VALUE`, `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `CANCELLED`, `DENIED`)
4. **Auto-refresh** via `refetchInterval: 30000` para manter atualizado sem depender de realtime

### Arquivo alterado
- `src/pages/MachineIntegrationPage.tsx` — adicionar query + Card de diagnóstico (~60 linhas)

