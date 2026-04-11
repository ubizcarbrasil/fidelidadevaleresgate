

## Plano: Notificar o empreendedor quando um cliente faz um resgate

### Problema
Atualmente nenhuma notificação é enviada ao empreendedor/admin quando um cliente resgata pontos (seja resgate de produto ou resgate de oferta da cidade). O empreendedor só descobre verificando manualmente as listas de resgates.

### Solução
Criar um sistema de notificações para o admin/empreendedor usando uma nova tabela `admin_notifications` e triggers de banco de dados.

### Mudanças

**1. Migração — criar tabela `admin_notifications`**
- Campos: `id`, `brand_id`, `title`, `body`, `type` (ex: `redemption_product`, `redemption_city`), `reference_id`, `is_read`, `created_at`
- RLS: SELECT/UPDATE para usuários com role na brand
- Índices em `brand_id` e `is_read`

**2. Migração — criar função + trigger para notificar em resgates**
- Trigger AFTER INSERT na tabela `product_redemption_orders`: insere notificação com título do produto, nome do cliente e pontos gastos
- Trigger AFTER INSERT na tabela `redemptions`: insere notificação com título da oferta e nome do cliente
- Ambos usam SECURITY DEFINER para bypassar RLS no insert

**3. Hook `useAdminNotifications`**
- Similar ao `useCustomerNotifications` mas filtra por `brand_id`
- Realtime subscription para novas notificações
- Funções `markAsRead` e `markAllAsRead`

**4. Componente de notificações no dashboard do empreendedor**
- Sino com badge de contagem no header ou na sidebar
- Dropdown/painel listando notificações recentes
- Ao clicar, marca como lida e navega para o detalhe do resgate

**5. Atualizar `AchadinhosAlerts`**
- Substituir a query de `customer_notifications` pela nova `admin_notifications` para mostrar alertas relevantes ao empreendedor

### Arquivos envolvidos
- 2 migrações SQL (tabela + triggers)
- `src/hooks/useAdminNotifications.ts` (novo)
- `src/components/dashboard/AdminNotificationBell.tsx` (novo)
- `src/components/dashboard/AchadinhosAlerts.tsx` (atualizar)

### Resultado
O empreendedor recebe notificações em tempo real quando qualquer cliente resgata pontos, tanto em produtos quanto em ofertas da cidade, com detalhes do resgate visíveis no dashboard.

