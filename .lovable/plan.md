

# Notificações push ao mudar status do pedido de resgate

## Visão Geral

Quando o admin muda o status de um pedido de resgate (Aprovado, Enviado, Entregue, Rejeitado), o sistema já tem a edge function `send-push-notification` que insere registros na tabela `customer_notifications`. O motorista já recebe notificações in-app via `useCustomerNotifications`. Basta integrar a chamada no fluxo de atualização de status.

## Alteração

### Arquivo: `src/pages/ProductRedemptionOrdersPage.tsx`

Após o `update` bem-sucedido do status (e após o refund se for REJECTED), chamar `supabase.functions.invoke("send-push-notification")` com:

- `customer_ids`: `[order.customer_id]`
- `title`: mensagem de acordo com o status (ex: "Pedido Aprovado ✅", "Pedido Enviado 📦", "Pedido Entregue 🎉", "Pedido Rejeitado")
- `body`: detalhes do produto e tracking code quando aplicável
- `reference_type`: `"product_redemption"`
- `reference_id`: `order.id`

Mapa de mensagens:
```
APPROVED → "Seu pedido de resgate foi aprovado! 🎉" / "O produto {título} foi aprovado e será enviado em breve."
SHIPPED  → "Seu pedido foi enviado! 📦" / "Rastreio: {tracking_code}"
DELIVERED → "Pedido entregue! ✅" / "O produto {título} foi entregue."
REJECTED → "Pedido de resgate não aprovado" / "Seus {points} pontos foram devolvidos."
```

### Nenhuma nova tabela, edge function ou migração necessária

O sistema de notificações já existe e funciona. Apenas falta conectar o evento de mudança de status à chamada da edge function existente.

