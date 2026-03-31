

# Ocultar "Resgatar com Pontos" para clientes (exibir apenas para motoristas)

## Problema
A seção virtual "Resgatar com Pontos" e o badge de resgate nos cards aparecem para todos os usuários, mas essa funcionalidade é exclusiva para motoristas. Clientes comuns não podem resgatar produtos com pontos.

## Solução
Usar o flag `isDriver` do `CustomerContext` para condicionar a exibição da categoria virtual `__redeemable__` e do badge de pontos nos cards.

## Arquivos a editar

### 1. `src/components/customer/AchadinhoSection.tsx`
- Extrair `isDriver` de `useCustomer()`
- No `useMemo` que monta as categorias, só injetar a categoria virtual "Resgatar com Pontos" se `isDriver === true`
- Só renderizar o badge de pontos nos cards se `isDriver`

### 2. `src/components/customer/AchadinhoDealsOverlay.tsx`
- Extrair `isDriver` de `useCustomer()`
- Só renderizar o badge de pontos nos cards se `isDriver`

Impacto mínimo: 2 arquivos, ~4 linhas alteradas em cada.

