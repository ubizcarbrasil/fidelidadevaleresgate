

## Plano: Notificações Telegram para Todas as Cidades

### Problema
Hoje cada cidade tem seu próprio campo `telegram_chat_id` na tabela `machine_integrations`. Leme foi criada mas o campo está vazio (`null`), por isso só Araxá (que tem o chat ID configurado) envia notificações no Telegram.

### Solução
Modificar o webhook (`machine-webhook/index.ts`) para, quando a integração da cidade não tiver `telegram_chat_id`, buscar o chat ID de outra integração da mesma marca que tenha um configurado. Assim, todas as cidades enviam para o mesmo grupo Telegram automaticamente.

### Mudanças

**1. `supabase/functions/machine-webhook/index.ts`**
- No bloco de envio Telegram (linha ~870), antes de verificar `integration.telegram_chat_id`, adicionar fallback:
  - Se `integration.telegram_chat_id` for null, fazer query em `machine_integrations` buscando qualquer integração da mesma `brand_id` que tenha `telegram_chat_id` não-nulo
  - Usar esse chat ID para enviar a notificação
- Isso garante que cidades novas herdem automaticamente o Telegram da marca sem precisar configurar manualmente em cada uma

**2. `src/features/integracao_mobilidade/components/aba_notificacoes.tsx`**
- Adicionar um aviso informativo indicando que o Chat ID configurado em uma cidade será usado para todas as cidades da marca que não tiverem Chat ID próprio

### Resultado
- Leme e qualquer cidade futura terão notificações Telegram imediatamente ao serem ativadas
- Não quebra o comportamento atual — cidades com chat ID próprio continuam usando o seu

