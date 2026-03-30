

# Corrigir erro "useCustomer must be used within CustomerProvider" na página de motorista

## Problema
A rota `/driver` renderiza `DriverPanelPage` diretamente, sem envolver com `CustomerProvider`. Quando o motorista clica num produto resgatável, o `DriverRedeemCheckout` chama `useCustomer()` e causa o crash.

## Solução
Envolver o conteúdo de `DriverPanelPage` com `CustomerProvider` (que já depende de `AuthContext` e `BrandContext`). Como `DriverPanelPage` gerencia brand/branch manualmente (via query params), há duas abordagens:

### Abordagem escolhida: Remover dependência de `useCustomer` do checkout do driver

O `DriverRedeemCheckout` usa `useCustomer()` apenas para pegar `customer.id`, `customer.name`, `customer.phone`, `customer.cpf` e `customer.points_balance`. Porém, o `DriverPanelPage` não tem o fluxo de `BrandProvider`/`CustomerProvider` — ele busca brand/branch por conta própria.

A solução mais robusta é **envolver com os providers necessários** no `DriverPanelPage`:

### `src/pages/DriverPanelPage.tsx`
1. Importar `CustomerProvider` de `@/contexts/CustomerContext`
2. Envolver o `DriverMarketplace` com `<CustomerProvider>` depois que brand e branch estiverem carregados
3. Garantir que `BrandContext` também esteja disponível — verificar se `BrandProvider` já envolve a rota ou se precisa ser adicionado

### Verificação adicional
- Confirmar que `AuthContext` e `BrandContext` já estão disponíveis na árvore de componentes acima de `DriverPanelPage`
- Se `BrandProvider` não estiver presente, será necessário adicioná-lo também, pois `CustomerProvider` depende de `useBrand()`

### Detalhes técnicos
- `CustomerProvider` depende de: `useAuth()` (user, roles) e `useBrand()` (brand, selectedBranch)
- `DriverPanelPage` busca brand/branch manualmente via query params, mas pode não estar dentro de `BrandProvider`
- Se necessário, criar um wrapper local que configure `BrandProvider` com os dados já carregados, ou passar customer data como props ao `DriverRedeemCheckout` em vez de usar o context

### Caminho mais simples
Verificar a árvore em `App.tsx`: se a rota `/driver` já está dentro de `AuthProvider` e `BrandProvider`, basta adicionar `<CustomerProvider>` em `DriverPanelPage`. Caso contrário, o `DriverRedeemCheckout` precisa receber os dados de customer via props.

