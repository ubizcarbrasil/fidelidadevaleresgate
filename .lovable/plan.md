

## Correção: Botão "Abrir" no card de cidades não leva ao painel correto

### Problema
O `DemoAccessCard` abre `/branch-wallet?branchId={branch.id}` ao clicar "Abrir", mas o `BranchWalletPage` **ignora completamente o parâmetro `branchId` da URL**. Ele usa apenas o `currentBranchId` do hook `useBrandGuard()`, que vem dos roles do usuário logado. Como o empreendedor (brand_admin) não tem `branch_id` nos seus roles, a página mostra "Nenhuma cidade vinculada ao seu perfil."

### Solução
Fazer o `BranchWalletPage` ler o parâmetro `branchId` da URL e usá-lo como override quando o usuário tem permissão suficiente (BRAND, TENANT ou ROOT).

### Arquivo modificado

**`src/pages/BranchWalletPage.tsx`**
- Importar `useSearchParams` do React Router
- Ler `branchId` dos search params
- Se presente e o `consoleScope` for BRAND/TENANT/ROOT, usar esse valor como `effectiveBranchId` em vez do `currentBranchId`
- Substituir todas as referências a `currentBranchId` por `effectiveBranchId` nas queries e mutações

```typescript
const [searchParams] = useSearchParams();
const urlBranchId = searchParams.get("branchId");
const effectiveBranchId = 
  urlBranchId && ["ROOT", "TENANT", "BRAND"].includes(consoleScope)
    ? urlBranchId 
    : currentBranchId;
```

Nenhuma mudança de banco de dados é necessária.

