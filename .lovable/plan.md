

# Adicionar seção "Resgatar com Pontos" nos Achadinhos (antes de Eletrônicos)

## O que muda

Criar uma seção de produtos resgatáveis no `AchadinhoSection` do cliente, exibida como a primeira categoria — antes de "Eletrônicos" e qualquer outra categoria existente.

## Alterações técnicas

### 1. `src/components/customer/AchadinhoSection.tsx`

- **Query**: Adicionar `is_redeemable, redeem_points_cost` ao select dos deals
- **Interface**: Adicionar `is_redeemable?: boolean` e `redeem_points_cost?: number | null` ao tipo `AffiliateDeal`
- **Filtro**: Criar `redeemableDeals` = deals filtrados por `is_redeemable === true`
- **Categoria virtual**: Injetar uma categoria virtual `__redeemable__` (ícone Gift, nome "Resgatar com Pontos") como **primeiro item** de `viableCategories`, antes de "Novas Ofertas" e "Eletrônicos"
- **Renderização**: No loop de categorias, quando `cat.id === "__redeemable__"`, mostrar os deals resgatáveis em carrossel horizontal com o custo em pontos (ao invés do preço em R$)
- **Card de resgate**: Exibir `redeem_points_cost` pts no lugar do preço, com ícone de moeda/pontos

### 2. Comportamento

- A seção só aparece se houver ≥ 3 deals resgatáveis (mesma regra de `MIN_DEALS`)
- Ao clicar num produto resgatável, abre o mesmo `AchadinhoDealDetail` (que já existe)
- A pill da categoria aparece no carrossel de categorias na posição 1 (após "Todos")

