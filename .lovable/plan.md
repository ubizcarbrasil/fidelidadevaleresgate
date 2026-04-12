

## Plano: Notificações de resgate com destaque vermelho, detalhes completos e Telegram

### 1. Estilo vermelho nas notificações de resgate

**Arquivos**: `AdminNotificationBell.tsx`, `AchadinhosAlerts.tsx`

- Notificações do tipo `redemption_product` e `redemption_city` terão fundo vermelho (`bg-red-500/10`, borda `border-red-500/30`), ícone vermelho e texto em destaque.
- O dot de não-lido será vermelho pulsante.
- No bell popover: fundo `bg-destructive/10` com borda vermelha para esses tipos.

### 2. Ao clicar na notificação, abrir detalhes completos do pedido

**Arquivos**: `AdminNotificationBell.tsx` (novo modal/dialog), novo componente `RedemptionOrderDetailDialog.tsx`

Ao clicar numa notificação de `redemption_product`:
- Usar o `reference_id` (que é o ID do `product_redemption_orders`) para buscar os dados completos do pedido.
- Exibir em um Dialog/Sheet:
  - **Dados do cliente**: nome, telefone, CPF
  - **Endereço de entrega**: CEP, endereço, número, complemento, bairro, cidade, estado
  - **Produto**: título, imagem (do snapshot), pontos gastos
  - **Link do produto**: `affiliate_url` (link do Mercado Livre) como botão clicável
  - **Status**: com badge colorido
  - **Código de rastreio** (se houver)

### 3. Notificação no Telegram quando houver resgate de produto

**Arquivo**: Atualizar o trigger SQL `notify_admin_product_redemption` para também disparar Telegram, **OU** (melhor abordagem) criar uma edge function `send-telegram-redemption-notification` chamada pelo frontend após o resgate.

**Abordagem escolhida**: Adicionar o envio de Telegram diretamente no fluxo de checkout (`CustomerRedeemCheckout.tsx` e `DriverRedeemCheckout.tsx`), após criar o pedido com sucesso. Isso reutiliza o padrão já existente de `send-telegram-ride-notification`.

- Buscar o `telegram_chat_id` da `machine_integrations` da marca (com fallback).
- Chamar `send-telegram-ride-notification` (ou criar uma nova function simples) com template de resgate:
  ```
  🛍️ Novo resgate de produto!
  👤 Cliente: Nome
  📱 Telefone: ...
  📦 Produto: "Kit 10 Peças..."
  🪙 Pontos: 5000 pts
  📍 Enviar para: Rua X, 123 - Cidade/UF
  🔗 Link: https://mercadolivre.com/...
  ```

**Alternativa mais limpa**: Adicionar o envio de Telegram dentro do próprio trigger SQL via `pg_net` ou, mais realisticamente, criar uma edge function `notify-product-redemption-telegram` que é chamada pelo trigger via webhook. Porém, a abordagem mais simples é chamar do frontend após o sucesso do insert.

### Resumo dos arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/AdminNotificationBell.tsx` | Estilo vermelho + onClick abre dialog de detalhes |
| `src/components/dashboard/AchadinhosAlerts.tsx` | Estilo vermelho nas notificações de resgate |
| `src/components/dashboard/RedemptionOrderDetailDialog.tsx` | **Novo** — Dialog com todos os dados do pedido |
| `src/components/customer/CustomerRedeemCheckout.tsx` | Enviar notificação Telegram após resgate |
| `src/components/driver/DriverRedeemCheckout.tsx` | Enviar notificação Telegram após resgate |
| `supabase/functions/send-telegram-ride-notification/index.ts` | Adicionar template para resgates de produto |

### Detalhes técnicos
- Sem migração SQL necessária — todos os dados já existem em `product_redemption_orders`.
- Reutiliza a edge function de Telegram existente, adicionando um novo template quando `is_redemption_notification = true`.
- O `reference_id` na `admin_notifications` já aponta para o ID do pedido, então a busca de detalhes é direta.

