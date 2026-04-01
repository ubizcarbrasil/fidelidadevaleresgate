

# Adicionar campo Telegram (opcional) ao wizard de criação de cidade

## Problema
Hoje o `telegram_chat_id` só pode ser configurado na página de integração root (`MachineIntegrationPage`). O empreendedor não tem como definir um grupo Telegram por cidade no wizard simplificado. Sem isso, todas as notificações caem no canal universal da marca.

## Solução

### 1. `src/pages/BrandBranchForm.tsx` — Adicionar campo opcional de Telegram
- Novo estado `telegramChatId`
- Novo campo de input opcional no formulário (entre o switch "Ativa" e o bloco de resumo):
  - Label: "Chat ID do Telegram (opcional)"
  - Placeholder: "Ex: -1001234567890"
  - Texto auxiliar explicando: "Se informado, as notificações de corridas desta cidade serão enviadas para este grupo. Caso contrário, será usado o canal padrão da marca."
- No `handleSave`, após criar/atualizar o branch, se `telegramChatId` foi preenchido e existe integração ativa, atualizar `machine_integrations` com o `telegram_chat_id` para aquele `branch_id`
- Em modo edição, carregar o `telegram_chat_id` existente da `machine_integrations` vinculada ao branch

### 2. `supabase/functions/register-machine-webhook/index.ts` — Aceitar `telegram_chat_id`
- Extrair `telegram_chat_id` do body junto com os outros campos
- Incluir no objeto `upsertData` (mesmo padrão dos campos `matrix_*`)

### 3. `src/pages/BrandBranchForm.tsx` — Passar `telegram_chat_id` na chamada ao edge function
- Quando o wizard invoca `register-machine-webhook`, incluir o `telegram_chat_id` no payload

## Detalhes técnicos
- Nenhuma migração necessária — a coluna `telegram_chat_id` já existe em `machine_integrations`
- A edge function `register-machine-webhook` já faz upsert com campos opcionais (padrão `matrix_*`), basta replicar para `telegram_chat_id`
- O campo é opcional: se vazio, nada muda no comportamento atual

