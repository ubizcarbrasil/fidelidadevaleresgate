

# Plano: Sistema de Fluxos de Mensagens para Motoristas via TaxiMachine

## Visão Geral

Criar um sistema completo de **fluxos de mensagens** (Message Flows) que permite ao administrador:
1. Enviar mensagens em massa (todos ou individual) via TaxiMachine
2. Criar templates de mensagem com variáveis dinâmicas (`{{nome}}`, `{{pontos}}`, `{{saldo}}`, etc.)
3. Configurar fluxos automáticos disparados por eventos de gamificação (duelo, cinturão, promoção)
4. Escolher audiência: todos motoristas, participantes do evento, ou motorista específico

## Arquitetura

```text
┌─────────────────────────────────────────────────┐
│          Painel Admin (Nova Aba)                │
│  "Mensagens" na Integração de Mobilidade        │
├──────────┬──────────────┬───────────────────────┤
│ Templates│ Fluxos Auto  │ Envio Manual (massa)  │
│ de Msg   │ por Evento   │ todos/individual      │
└────┬─────┴──────┬───────┴───────────┬───────────┘
     │            │                   │
     ▼            ▼                   ▼
┌─────────────────────────────────────────────────┐
│     driver_message_templates (nova tabela)       │
│     driver_message_flows (nova tabela)           │
│     driver_message_logs (nova tabela)            │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Edge Function: send-driver-message (nova)       │
│  - Resolve variáveis do template                 │
│  - Envia via TaxiMachine API                     │
│  - Registra log de envio                         │
└─────────────────────────────────────────────────┘
```

## Banco de Dados — 3 novas tabelas

### 1. `driver_message_templates`
Armazena modelos de mensagem reutilizáveis com variáveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| brand_id | uuid FK brands | |
| name | text | Nome do template (ex: "Desafio recebido") |
| body_template | text | Corpo com variáveis: `{{nome}}`, `{{pontos}}`, `{{saldo}}`, `{{adversario}}`, `{{corridas}}` |
| available_vars | text[] | Lista de variáveis suportadas |
| category | text | `duel`, `belt`, `promotion`, `general`, `scoring` |
| is_active | boolean | |
| created_at, updated_at | timestamptz | |

### 2. `driver_message_flows`
Configura automações: qual evento dispara qual template, para qual audiência.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| brand_id | uuid FK brands | |
| branch_id | uuid FK branches (nullable) | Filtra por cidade ou null=todas |
| event_type | text | `DUEL_CHALLENGE_RECEIVED`, `DUEL_ACCEPTED`, `DUEL_DECLINED`, `DUEL_FINISHED`, `DUEL_VICTORY`, `BELT_NEW_CHAMPION`, `PROMOTION_NEW`, `MANUAL_BROADCAST` |
| template_id | uuid FK driver_message_templates | |
| audience | text | `all_drivers`, `participants`, `winner`, `loser`, `challenger`, `challenged`, `individual` |
| is_active | boolean | |
| created_at, updated_at | timestamptz | |

### 3. `driver_message_logs`
Registro de cada mensagem enviada para auditoria.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| brand_id | uuid FK brands | |
| branch_id | uuid FK branches (nullable) | |
| flow_id | uuid FK (nullable) | Qual fluxo disparou (null = envio manual) |
| template_id | uuid FK (nullable) | |
| customer_id | uuid FK customers | Motorista destinatário |
| event_type | text | |
| rendered_message | text | Mensagem final após substituição |
| status | text | `sent`, `failed`, `skipped` |
| error_detail | text (nullable) | |
| metadata_json | jsonb | Dados de contexto |
| created_at | timestamptz | |

## Edge Function: `send-driver-message`

Nova edge function que:
1. Recebe: `brand_id`, `branch_id?`, `event_type`, `template_id?`, `audience`, `customer_ids?`, `context_vars` (dados para substituir variáveis)
2. Consulta o template e o fluxo ativo
3. Resolve audiência (busca motoristas conforme `audience`)
4. Substitui variáveis `{{nome}}`, `{{pontos}}`, `{{saldo}}`, `{{adversario}}`, `{{corridas}}`, `{{premio}}`
5. Envia via API TaxiMachine (`enviarMensagem`)
6. Registra em `driver_message_logs`

Variáveis suportadas:
- `{{nome}}` — nome limpo do motorista
- `{{pontos}}` — pontos do contexto (aposta, ganho, etc.)
- `{{saldo}}` — saldo atual do motorista
- `{{adversario}}` — nome do oponente no duelo
- `{{corridas}}` — contagem de corridas
- `{{premio}}` — valor do prêmio
- `{{cidade}}` — nome da cidade/branch

## Interface Admin — Nova aba "Mensagens" na Integração de Mobilidade

### Sub-aba 1: Templates de Mensagem
- Lista de templates existentes com nome, categoria e preview
- Botão criar/editar template com editor de texto e inserção de variáveis via chips clicáveis
- Preview em tempo real da mensagem com dados fictícios

### Sub-aba 2: Fluxos Automáticos
- Lista de eventos disponíveis com toggle ativo/inativo
- Para cada evento: selecionar template, escolher audiência (todos, participantes, individual)
- Indicador visual de status (ativo/inativo) por evento

### Sub-aba 3: Envio Manual
- Seletor de audiência: todos os motoristas da marca/cidade ou buscar motorista específico
- Campo de mensagem livre OU selecionar template existente
- Inserção de variáveis via chips
- Botão enviar com confirmação e contador de destinatários
- Histórico de envios manuais recentes

## Integração com Fluxos Existentes

Modificar a edge function `send-push-notification` (e `finalize-duels-cron`) para, após cada evento de duelo/cinturão, chamar `send-driver-message` quando houver um fluxo ativo configurado. Isso conecta os eventos existentes ao novo sistema de mensagens personalizadas.

## Arquivos a Criar/Modificar

### Novos:
1. `src/features/integracao_mobilidade/components/aba_mensagens.tsx` — aba principal
2. `src/features/integracao_mobilidade/components/lista_templates_mensagem.tsx` — CRUD templates
3. `src/features/integracao_mobilidade/components/editor_template_mensagem.tsx` — editor com variáveis
4. `src/features/integracao_mobilidade/components/lista_fluxos_mensagem.tsx` — config fluxos
5. `src/features/integracao_mobilidade/components/envio_manual_mensagem.tsx` — envio em massa/individual
6. `src/features/integracao_mobilidade/hooks/hook_message_templates.ts` — queries templates
7. `src/features/integracao_mobilidade/hooks/hook_message_flows.ts` — queries fluxos
8. `supabase/functions/send-driver-message/index.ts` — nova edge function

### Modificados:
1. `src/pages/MachineIntegrationPage.tsx` — adicionar nova aba "Mensagens"
2. `supabase/functions/send-push-notification/index.ts` — trigger de fluxos automáticos
3. `supabase/functions/finalize-duels-cron/index.ts` — trigger de fluxos pós-duelo

### Migrações:
1. Criar tabelas `driver_message_templates`, `driver_message_flows`, `driver_message_logs` com RLS
2. Seed de templates padrão para cada evento de duelo/cinturão

