

## Plano: Módulo de Resgate de Produtos com Pontos para Clientes

### Objetivo
Criar no app do cliente uma experiência de resgate de produtos com pontos idêntica à do motorista, com controle administrativo para ativar/desativar e opção de espelhar os mesmos produtos do motorista.

### O que existe hoje
- **Motorista**: Tem `DriverRedeemStorePage` + `DriverRedeemCheckout` que listam `affiliate_deals` com `is_redeemable = true`, fazem checkout com endereço e criam pedidos em `product_redemption_orders`.
- **Cliente**: Não possui módulo de resgate de produtos com pontos. Tem apenas resgate de ofertas de lojas parceiras via `redemptions`.
- **Tabela `affiliate_deals`**: Possui `is_redeemable` e `redeem_points_cost` sem distinção de público (motorista vs cliente).
- **Tabela `product_redemption_orders`**: Não possui campo para distinguir se o pedido veio de motorista ou cliente.

### Mudanças necessárias

#### 1. Banco de dados

**Tabela `affiliate_deals`** — adicionar coluna:
- `redeemable_by TEXT DEFAULT 'driver'` — valores: `'driver'`, `'customer'`, `'both'`
- Migrar dados existentes: todos os `is_redeemable = true` passam a ter `redeemable_by = 'driver'`

**Tabela `product_redemption_orders`** — adicionar coluna:
- `order_source TEXT DEFAULT 'driver'` — valores: `'driver'`, `'customer'`

**Module definition** — inserir novo módulo:
- `key: 'customer_product_redeem'`, `name: 'Resgate de Produtos (Cliente)'`, `category: 'fidelidade'`, `customer_facing: true`

**Brand settings** — usar campo no `brand_settings_json`:
- `customer_redeem_mirror_driver: boolean` — se true, espelha todos os produtos do motorista automaticamente para o cliente

#### 2. Painel Administrativo

**Página de Produtos de Resgate** (`/produtos-resgate`):
- Adicionar coluna/filtro "Público": Motorista, Cliente, Ambos
- Ao marcar um produto como resgatável, permitir escolher o público-alvo
- Toggle global "Espelhar produtos do motorista para o cliente" nas configurações da marca

**Módulos da marca**:
- Novo módulo `customer_product_redeem` aparece na lista de módulos para ativar/desativar

**Pedidos de Resgate** (`/product-redemption-orders`):
- Adicionar filtro e badge de origem (Motorista / Cliente)

#### 3. App do Cliente — Nova aba/seção de Resgate

**Componentes novos** (reutilizando lógica do motorista):
- `src/components/customer/CustomerRedeemStorePage.tsx` — loja de resgate com grid, filtros por categoria, saldo de pontos (idêntica visualmente à `DriverRedeemStorePage`)
- `src/components/customer/CustomerRedeemCheckout.tsx` — checkout com formulário de endereço e ViaCEP (idêntico ao `DriverRedeemCheckout`, mas usando `CustomerContext` em vez de `DriverSessionContext`)
- `src/components/customer/CustomerRedeemOrderHistory.tsx` — histórico de pedidos

**Integração no `CustomerLayout`**:
- Nova aba "Loja" ou seção na home do cliente, condicionada ao módulo `customer_product_redeem` estar ativo
- A query de produtos filtra por `redeemable_by IN ('customer', 'both')` + verifica o flag de espelhamento

#### 4. Lógica de espelhamento

Quando `customer_redeem_mirror_driver = true` nas settings da marca:
- A query do cliente busca `is_redeemable = true` (todos os produtos do motorista ficam visíveis)
- Quando `false`, busca apenas `redeemable_by IN ('customer', 'both')`

#### 5. Configuração de regras de pontos

As regras de conversão de pontos para resgate do cliente serão as mesmas do motorista (mesma tabela `affiliate_deals.redeem_points_cost`), conforme solicitado. Não será necessário criar regras separadas.

### Arquivos envolvidos

**Novos:**
- `src/components/customer/CustomerRedeemStorePage.tsx`
- `src/components/customer/CustomerRedeemCheckout.tsx`
- `src/components/customer/CustomerRedeemOrderHistory.tsx`

**Modificados:**
- `src/components/customer/CustomerLayout.tsx` — nova aba condicional
- `src/pages/customer/CustomerHomePage.tsx` — seção de resgate na home
- `src/pages/produtos_resgate/` — filtro de público-alvo
- `src/pages/ProductRedemptionOrdersPage.tsx` — filtro de origem
- Migration SQL para colunas novas + module definition

### Detalhes técnicos
- Os componentes do cliente reutilizam a mesma tabela `affiliate_deals` e `product_redemption_orders`
- A distinção é feita pelo campo `redeemable_by` (quem pode ver) e `order_source` (quem comprou)
- O checkout do cliente usa `CustomerContext` (CPF + saldo) em vez de `DriverSessionContext`
- O débito de pontos segue o mesmo padrão: INSERT no `points_ledger` + UPDATE no `customers.points_balance`
- RLS: `product_redemption_orders` já permite insert/select por `customer_id`, então funciona para ambos os públicos

