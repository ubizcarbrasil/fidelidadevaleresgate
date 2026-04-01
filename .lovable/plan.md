

# Exibir "Ganhe X pts" nos cards de Achadinhos do Motorista

## Objetivo
Mostrar abaixo do preço de cada produto no card do motorista a quantidade de pontos que ele ganharia com aquela compra, baseado na regra ativa de pontuação da marca (ex: "Ganhe 100 pts" para um produto de R$ 100,00 com regra de 1 pt/R$).

## Como funciona
- Buscar a regra ativa de pontuação (`points_rules`) da marca no `DriverMarketplace`
- Calcular `pontos = Math.floor(preço × points_per_real)` para cada deal que tem preço
- Passar `pointsPerReal` como prop para os cards
- Renderizar um badge verde "Ganhe X pts" abaixo do preço (apenas quando o deal tem preço e a regra existe)

## Arquivos a editar

### 1. `src/components/driver/DriverMarketplace.tsx`
- Adicionar query para buscar a regra ativa: `points_rules` filtrada por `brand_id` e `is_active = true`, pegando `points_per_real`
- Passar `pointsPerReal` como prop para `DriverDealCard` e `DriverDealCardGrid`

### 2. `src/components/driver/DriverDealCard.tsx`
- Nova prop opcional `pointsPerReal?: number`
- Calcular `earnedPoints = Math.floor((deal.price ?? 0) * pointsPerReal)` quando preço e regra existem
- Renderizar badge "Ganhe {formatPoints(earnedPoints)} pts" com ícone de estrela/moeda, em verde, abaixo do preço (acima do badge de resgate existente)

### 3. `src/components/driver/DriverDealCardGrid.tsx`
- Mesma lógica do `DriverDealCard`: nova prop `pointsPerReal`, cálculo e badge idênticos

## Visual do badge
```text
┌──────────────────┐
│  [imagem]        │
│                  │
│  Loja X          │
│  Título produto  │
│  R$ 100,00       │
│  ⭐ Ganhe 100 pts │  ← novo badge verde
│  🎁 500 pts      │  ← badge resgate (existente)
└──────────────────┘
```

Badge com fundo verde suave (`#22c55e15`), texto verde (`#22c55e`), ícone `Star`, mesmo estilo visual do badge de resgate já existente.

## Impacto
3 arquivos editados, ~10 linhas por card + 1 query adicional no marketplace.

