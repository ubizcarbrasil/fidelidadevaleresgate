

# Cálculo automático de custo em pontos no modal de resgate

## Contexto
A página "Regras de Resgate" (`/regras-resgate`) já define uma taxa `points_per_real` (pontos por R$1). O modal atual exige que o admin digite manualmente o custo em pontos para cada produto, mas o preço em reais já existe no `affiliate_deals.price`.

## Solução
Calcular automaticamente `redeem_points_cost = price × points_per_real` para cada produto, com opção de sobrescrever manualmente.

## Alterações

### `src/pages/produtos_resgate/components/ModalAdicionarResgatavel.tsx`

1. **Buscar `points_per_real`**: Nova query para ler `brands.brand_settings_json` → `redemption_rules.points_per_real` (default: 1)

2. **Modo automático por padrão**: Adicionar toggle/switch "Calcular automaticamente" (ligado por padrão)
   - Quando ativo: esconde o input manual, calcula `Math.ceil(price × points_per_real)` por produto
   - Quando desligado: mostra o input manual de custo global (comportamento atual)

3. **Exibir custo calculado na lista**: Ao lado do preço R$ de cada produto, mostrar o custo em pontos calculado (ex: `R$ 17,99 · ~18 pts`)

4. **Mutation**: Quando automático, fazer updates individuais com custo calculado por produto (cada um terá valor diferente baseado no seu preço). Quando manual, manter o comportamento atual de custo único para todos.

5. **Produtos sem preço**: Se `price` for null/0, exigir input manual para esses itens ou excluí-los do cálculo automático com aviso.

### Detalhes técnicos
- Query da taxa: `supabase.from("brands").select("brand_settings_json").eq("id", currentBrandId).single()` → extrair `redemption_rules.points_per_real`
- Cálculo: `Math.ceil(price * pointsPerReal)` (arredonda para cima, nunca 0)
- Para update em lote com valores diferentes: fazer `Promise.all` de updates individuais ou loop sequencial

