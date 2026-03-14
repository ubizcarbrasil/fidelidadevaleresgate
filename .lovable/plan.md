

## Plano: Relatório em tempo real de pontuações na tela de integração

### Objetivo
Quando um cliente for pontuado via webhook (corrida finalizada), exibir um feed/log em tempo real na página de integração Machine, e permitir envio de notificação para sistemas externos via callback URL configurável.

### O que será feito

**1. Feed de eventos em tempo real na MachineIntegrationPage**
- Adicionar uma nova seção "Relatório em tempo real" na página de integração
- Usar Supabase Realtime para escutar inserts na tabela `machine_ride_events` filtrados por `brand_id`
- Exibir cada evento como um card/linha com: status, ID da corrida, valor, pontos creditados, timestamp
- Destacar visualmente quando pontos são creditados (status F com pontos > 0)
- Mostrar os últimos 50 eventos com scroll, atualizando ao vivo

**2. Sinal visual no dashboard (badge/toast)**
- Quando um evento de pontuação chegar em tempo real, exibir um toast notification no painel
- Atualizar os contadores do dashboard (corridas e pontos) automaticamente

**3. Callback URL para sistemas externos (opcional configurável)**
- Adicionar campo `callback_url` na tabela `machine_integrations` para o usuário configurar uma URL externa
- Quando pontos forem creditados no webhook, disparar um POST para essa URL com os dados da pontuação (ride_id, cpf_masked, points, ride_value)
- Exibir campo de configuração na página de integração

### Alterações

| Componente | Ação |
|---|---|
| Migração SQL | Adicionar coluna `callback_url` em `machine_integrations` |
| `machine-webhook/index.ts` | Após pontuar, disparar POST para `callback_url` se configurada |
| `MachineIntegrationPage.tsx` | Adicionar feed Realtime de eventos + campo callback_url + toast ao vivo |

### Detalhes técnicos

- O Realtime já está habilitado na tabela `machine_ride_events` (migração anterior)
- O feed usará `supabase.channel('ride-events').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'machine_ride_events', filter: 'brand_id=eq.XXX' })`
- O callback externo será fire-and-forget (não bloqueia o webhook) com timeout de 5s
- Query inicial carrega os últimos 50 eventos para histórico

