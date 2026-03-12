

## Plano: Restringir roles disponíveis por nível do usuário logado

### Problema
Atualmente, o empreendedor (`brand_admin`) consegue atribuir qualquer role, incluindo `root_admin`, `tenant_admin` e `brand_admin`, que são superiores ou iguais ao seu nível. Isso é uma falha de segurança e UX.

### Solução
Filtrar a lista de roles no dialog "Atribuir Role" com base no nível do usuário logado:

- **root_admin**: vê todos os roles
- **brand_admin**: vê apenas `branch_admin`, `branch_operator`, `operator_pdv`, `store_admin`, `customer`
- **branch_admin**: vê apenas `branch_operator`, `operator_pdv`, `store_admin`, `customer`

### Alteração

**`src/pages/UsersPage.tsx`**:
1. Criar um mapa de roles permitidos por nível:
   ```typescript
   const ALLOWED_ROLES: Record<string, AppRole[]> = {
     root_admin: ["root_admin","tenant_admin","brand_admin","branch_admin","branch_operator","operator_pdv","store_admin","customer"],
     brand_admin: ["branch_admin","branch_operator","operator_pdv","store_admin","customer"],
     branch_admin: ["branch_operator","operator_pdv","store_admin","customer"],
   };
   ```
2. Determinar o nível do usuário logado e filtrar `Object.entries(ROLE_LABELS)` para mostrar apenas os roles permitidos no `<Select>` de "Papel".
3. Ajustar o `selectedRole` default para o primeiro role permitido (ex: `branch_admin` para empreendedores).
4. Também ocultar o campo "Organização" (tenant) e "Marca" (brand) para brand_admin, já que ele só opera dentro da própria marca.

