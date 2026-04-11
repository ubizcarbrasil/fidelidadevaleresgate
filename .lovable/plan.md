

## Plano: Completar UI administrativa do módulo de resgate do cliente

### O que já está pronto
- Banco de dados: colunas `redeemable_by` e `order_source` criadas, triggers de validação, módulo registrado
- App do cliente: `CustomerRedeemStorePage`, `CustomerRedeemCheckout`, `CustomerRedeemOrderHistory` implementados
- Aba "Loja" no `CustomerLayout` condicionada ao módulo `customer_product_redeem`
- Página de Pedidos de Resgate: filtro e badge de origem (Motorista/Cliente)
- Badge de público na listagem de Produtos de Resgate (somente leitura)

### O que falta

#### 1. Dropdown para alterar `redeemable_by` por produto
Na página `ProdutosResgatePage.tsx`, adicionar um `<Select>` inline em cada linha/card para que o admin possa trocar o público-alvo (Motorista / Cliente / Ambos) de cada produto. Ao trocar, chamar `updateDeal.mutate` com `{ redeemable_by: valor }`.

#### 2. Ação em lote para definir público-alvo
Junto das ações de batch existentes (definir custo, remover resgate), adicionar um select + botão para definir `redeemable_by` em massa nos produtos selecionados.

#### 3. Toggle "Espelhar produtos do motorista para cliente"
Adicionar na página `ProdutosResgatePage` (ou nas configurações da marca) um toggle/switch que salva `customer_redeem_mirror_driver: true/false` no `brand_settings_json` da marca. Quando ativo, o app do cliente mostra todos os produtos resgatáveis do motorista automaticamente, sem precisar marcar cada um como "Ambos".

### Arquivos envolvidos
- `src/pages/ProdutosResgatePage.tsx` — adicionar Select inline, ação em lote e toggle de espelhamento

### Detalhes técnicos
- O Select inline usa o componente `Select` do shadcn com opções: `driver`, `customer`, `both`
- O toggle de espelhamento lê/salva no campo `brand_settings_json` via `supabase.from("brands").update(...)` 
- As ações em lote reutilizam a mutation `batchUpdate` já existente
- Nenhuma mudança de banco necessária — tudo já existe no schema
