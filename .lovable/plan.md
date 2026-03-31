

# Adicionar badge "Resgate com Pontos" nos cards de Achadinhos

## Problema
Quando um produto é marcado como resgatável (`is_redeemable = true`), ele aparece tanto na categoria normal quanto na seção "Resgatar com Pontos", mas no card da categoria normal não há nenhuma indicação visual de que o produto pode ser resgatado com pontos.

## Solução
Adicionar um badge discreto no canto inferior da imagem (ou abaixo do preço) indicando o custo em pontos, exibido apenas quando `deal.is_redeemable && deal.redeem_points_cost > 0` e a categoria atual **não** for a virtual de resgate (para evitar redundância).

## Arquivos a editar

### 1. `src/components/driver/DriverDealCard.tsx`
- Importar `Gift` do lucide-react e `formatPoints`
- Abaixo do bloco de preço, quando `deal.is_redeemable && deal.redeem_points_cost`, renderizar um badge compacto:
  ```
  🎁 {formatPoints(redeem_points_cost)} pts
  ```
- Estilo: fundo sutil com cor de destaque, texto pequeno, ícone Gift

### 2. `src/components/driver/DriverDealCardGrid.tsx`
- Mesma lógica do DriverDealCard (usado na view de grid/categoria)

### 3. `src/components/customer/AchadinhoDealsOverlay.tsx`
- Adicionar `is_redeemable` e `redeem_points_cost` à interface local `AffiliateDeal` e à query select
- Renderizar o mesmo badge nos cards da overlay de categoria

### 4. `src/components/customer/AchadinhoSection.tsx`
- A query já busca `is_redeemable` e `redeem_points_cost` — nenhuma mudança na query
- Os cards passados para os componentes já contêm os dados necessários

## Design do badge
- Posição: abaixo do preço, dentro do `p-3`
- Visual: pill compacta com fundo `highlight/10`, ícone `Gift` + texto `{pts} pts`
- Tamanho: `text-[9px]`, mesmo padrão dos outros badges
- Não exibir na seção virtual `__redeemable__` (já mostra pontos como preço principal)

