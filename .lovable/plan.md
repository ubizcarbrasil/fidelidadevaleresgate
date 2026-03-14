

## Diagnóstico do Erro 502

O erro 502 vem de **credenciais TaxiMachine inválidas**. Quando o webhook tenta buscar o recibo na API TaxiMachine, ela retorna `401 Unauthorized`, e o código repassa isso como HTTP 502.

### Problemas encontrados no banco:

| Problema | Detalhe |
|---|---|
| **Integração legada ainda ativa** | O registro `a491dc74` (sem cidade, sem credenciais) continua ativo — a desativação anterior não persistiu |
| **Espaço no usuário** | O campo `basic_auth_user` de Araxá contém `" fidelidade@araxa.com"` (espaço no início), o que invalida a autenticação Basic Auth |
| **Telegram Chat ID vazio** | O `telegram_chat_id` de Araxá está `null` — por isso nenhuma notificação Telegram é enviada mesmo que pontos fossem creditados |

### Correções

1. **Webhook (`machine-webhook/index.ts`)**: Adicionar `.trim()` nos campos `basic_auth_user` e `basic_auth_password` antes de montar o header Basic Auth. Também mudar o retorno de 502 para 400 quando TaxiMachine retorna 401 (credencial inválida), com mensagem clara.

2. **Migração SQL**: Desativar a integração legada `a491dc74` e corrigir o espaço no `basic_auth_user` de Araxá.

3. **Nenhuma mudança na UI** necessária.

### Ação do usuário

Após as correções, você precisará **configurar o Chat ID do Telegram** na página de Mobilidade para receber as notificações.

