

## Plano: Mostrar dados completos dos clientes nos resgates do lojista

### Problema
A aba "Resgates" do painel do lojista mostra apenas nome do cliente e CPF. Falta telefone, qual oferta resgatou (já tem parcialmente) e a validade da oferta.

### Solução

**Arquivo:** `src/components/store-owner/StoreRedeemTab.tsx`

1. Alterar a query para incluir `phone` dos clientes e `end_at` das ofertas:
   - De: `customers(name)` → `customers(name, phone)`
   - De: `offers!inner(title, value_rescue, min_purchase, store_id, coupon_type)` → adicionar `end_at`
2. Mapear `customer_phone` e `offer_end_at` no objeto de retorno

**Arquivo:** `src/components/store-owner/RedemptionHistoryList.tsx`

1. Adicionar `customer_phone` e `offer_end_at` ao tipo `PendingRedemption`
2. No card pendente: exibir telefone do cliente abaixo do nome e validade da oferta nos detalhes
3. Na lista de "Baixas Recentes": exibir telefone e oferta (já mostra oferta, adicionar telefone)

### Campos exibidos por resgate
- Nome do cliente
- Telefone do cliente
- Título da oferta resgatada
- Validade da oferta (`end_at`)
- Dados já existentes (PIN, crédito, compra mínima, etc.)

