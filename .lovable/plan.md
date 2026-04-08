

## Correção: Isolamento de cidades no editor de filial do motorista

### Problema
O componente `DriverBranchEditor` lista **todas** as cidades ativas da marca, permitindo que um franqueado (Branch Admin) de Leme veja e transfira motoristas para Araxá. Isso viola o isolamento por cidade.

### Solução
Usar o `consoleScope` e `currentBranchId` do hook `useBrandGuard` para:
1. **Se `consoleScope === "BRANCH"`**: ocultar completamente o `DriverBranchEditor` (franqueado não pode transferir motoristas entre cidades)
2. **Se `consoleScope === "BRAND"` ou superior**: manter o comportamento atual (empreendedor pode gerenciar todas as cidades)

### Arquivos modificados

**`src/components/driver-management/tabs/AbaDadosMotorista.tsx`**
- Importar `useBrandGuard`
- Renderizar `DriverBranchEditor` apenas quando `consoleScope !== "BRANCH"`

### Alternativa considerada
Filtrar o dropdown para mostrar apenas a branch do usuário. Descartada porque não faz sentido oferecer um dropdown com uma única opção -- o motorista já está naquela cidade. Ocultar o componente inteiro é mais limpo.

