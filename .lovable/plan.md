

# Módulo de Resgate de Produtos com Pontos para Motoristas

## Visão Geral

Criar um fluxo completo onde motoristas usam pontos acumulados para solicitar produtos do catálogo de Achadinhos. O admin marca produtos como "resgatáveis", o motorista faz checkout com dados de entrega, e o pedido chega no painel admin para processamento manual (compra no Mercado Livre e envio).

---

## 1. Banco de Dados — 3 migrações

### 1.1 Adicionar campo na tabela `affiliate_deals`
```sql
ALTER TABLE affiliate_deals ADD COLUMN is_redeemable boolean DEFAULT false;
ALTER TABLE affiliate_deals ADD COLUMN redeem_points_cost integer DEFAULT null;
```
- `is_redeemable`: admin ativa no painel de Achadinhos
- `redeem_points_cost`: custo em pontos (se null, usa o `price` × 1pt/R$1)

### 1.2 Nova tabela `product_redemption_orders`
```sql
CREATE TABLE product_redemption_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  branch_id uuid REFERENCES branches(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  deal_id uuid NOT NULL REFERENCES affiliate_deals(id),
  deal_snapshot_json jsonb NOT NULL,
  affiliate_url text NOT NULL,
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_cpf text,
  delivery_cep text NOT NULL,
  delivery_address text NOT NULL,
  delivery_number text NOT NULL,
  delivery_complement text,
  delivery_neighborhood text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  admin_notes text,
  tracking_code text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_redemption_orders ENABLE ROW LEVEL SECURITY;
```

### 1.3 RLS policies
- Motoristas (authenticated) podem INSERT e SELECT nos próprios pedidos (`customer_id` via `get_own_customer_ids`)
- Brand admins podem SELECT e UPDATE pedidos da sua marca

---

## 2. Painel Admin — Gerenciar produtos resgatáveis

### 2.1 Na página de Achadinhos existente (`AffiliateDealsPage`)
- Adicionar toggle "Resgatável" em cada deal card/edição
- Campo de custo em pontos (padrão: preço × 1)

### 2.2 Nova página: **Pedidos de Resgate** (`/product-redemption-orders`)
- Listagem de pedidos com status (PENDING, APPROVED, SHIPPED, DELIVERED, REJECTED)
- Cada pedido mostra: produto, dados do motorista, endereço, link do Mercado Livre, pontos gastos
- Ações: Aprovar, Rejeitar (devolver pontos), Marcar como Enviado (+ código de rastreio), Marcar como Entregue
- Adicionar item no sidebar do grupo "Achadinhos"

---

## 3. Interface do Motorista — Vitrine de Resgate

### 3.1 Nova aba no `DriverMarketplace` ou seção dedicada
- Filtro/aba "Resgatar com Pontos" que exibe apenas deals com `is_redeemable = true`
- Card do produto mostra preço em pontos ao invés de R$
- Badge "Resgate" visual no card

### 3.2 Tela de Checkout (`DriverRedeemCheckout`)
- Exibe produto selecionado + custo em pontos
- Formulário: Nome, Telefone, CPF, CEP (com busca automática via ViaCEP), Endereço, Número, Complemento, Bairro, Cidade, Estado
- Validação de saldo de pontos suficiente
- Botão "Confirmar Resgate"
- Ao confirmar: debita pontos no `points_ledger` + cria registro em `product_redemption_orders`

### 3.3 Histórico de Resgates no Dashboard do Motorista
- Seção "Meus Resgates" no `CustomerDriverDashboardPage` mostrando pedidos com status

---

## 4. Sidebar e Rotas

- Nova rota `/product-redemption-orders` (admin) com `ModuleGuard` key `affiliate_deals`
- Nova entrada no sidebar do grupo Achadinhos: "Pedidos de Resgate"
- Rota de checkout no contexto do motorista (overlay/modal dentro do marketplace)

---

## Arquivos afetados/criados

| Ação | Arquivo |
|------|---------|
| Migração | 3 SQL migrations |
| Criar | `src/pages/ProductRedemptionOrdersPage.tsx` |
| Criar | `src/components/driver/DriverRedeemSection.tsx` |
| Criar | `src/components/driver/DriverRedeemCheckout.tsx` |
| Criar | `src/components/driver/DriverRedeemOrderHistory.tsx` |
| Editar | `src/components/driver/DriverMarketplace.tsx` (aba resgate) |
| Editar | `src/components/driver/DriverDealCard.tsx` (badge resgate + preço em pts) |
| Editar | `src/pages/customer/CustomerDriverDashboardPage.tsx` (seção pedidos) |
| Editar | `src/components/consoles/BrandSidebar.tsx` (menu) |
| Editar | `App.tsx` (rota admin) |
| Editar | Página de edição de deals (toggle resgatável) |

