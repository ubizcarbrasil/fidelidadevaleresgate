

## Continuação: Notificações Telegram + Painel em Tempo Real

O plano já foi aprovado. A implementação anterior foi interrompida porque o **conector Telegram ainda não está vinculado** ao projeto (apenas Firecrawl está conectado).

### Sequência de implementação

**1. Conectar Telegram**
- Vincular o conector Telegram ao projeto via `standard_connectors--connect`. Isso disponibilizará `TELEGRAM_API_KEY` e `LOVABLE_API_KEY` como secrets para as edge functions.

**2. Migração SQL**
- Adicionar coluna `telegram_chat_id TEXT` em `machine_integrations`
- Criar tabela `machine_ride_notifications` com RLS e Realtime habilitado

**3. Edge Function `send-telegram-ride-notification`**
- Recebe dados da pontuação, formata mensagem em português e envia via gateway Telegram (`https://connector-gateway.lovable.dev/telegram/sendMessage`)
- Registrar em `supabase/config.toml` com `verify_jwt = false`

**4. Atualizar `machine-webhook/index.ts`**
- Após `pointsCredited = true`, inserir registro em `machine_ride_notifications` (com nome, telefone, cidade, pontos, valor, horário)
- Se `telegram_chat_id` estiver configurado na integração, invocar `send-telegram-ride-notification` (fire-and-forget)

**5. UI — `MachineIntegrationPage.tsx`**
- Novo card **"Últimas pontuações"** com Supabase Realtime na tabela `machine_ride_notifications` — mostra nome, telefone mascarado, cidade, valor, pontos, horário
- Campo **"Chat ID do Telegram"** no card de detalhes de cada cidade ativa, com botão Salvar
- Instrução inline sobre como obter o chat_id via @BotFather e @userinfobot

### Arquivos impactados
| Arquivo | Ação |
|---|---|
| Migration SQL | Nova tabela + coluna |
| `supabase/functions/send-telegram-ride-notification/index.ts` | Criar |
| `supabase/functions/machine-webhook/index.ts` | Editar (inserir notificação + chamar Telegram) |
| `src/pages/MachineIntegrationPage.tsx` | Editar (painel realtime + campo chat_id) |
| `supabase/config.toml` | Registrar nova function |

