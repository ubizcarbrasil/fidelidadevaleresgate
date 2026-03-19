

## Plano: Corrigir filtragem de módulos no console Branch Admin

### Problema
O console "Gestão Regional" (Branch Admin) mostra **todos** os itens de menu, ignorando os módulos que o empreendedor ativou/desativou. Isso acontece porque:

1. O role `branch_admin` pode não ter `brand_id` preenchido na tabela `user_roles` (só tem `branch_id`)
2. `useBrandGuard` retorna `currentBrandId = null`
3. `useBrandModules` desabilita a query (pois `enabled: !!currentBrandId`)
4. O fallback `if (!brandModules) return true` libera **tudo**

### Solução
Tornar o hook `useBrandModules` capaz de resolver o `brand_id` a partir do `branch_id` quando necessário.

**Arquivo:** `src/hooks/useBrandModules.ts`

1. Importar `currentBranchId` do `useBrandGuard`
2. Adicionar uma query auxiliar que busca `brand_id` na tabela `branches` quando `currentBrandId` é null mas `currentBranchId` existe
3. Usar o `brand_id` resolvido (direto ou via branch) para a query principal de módulos
4. Alterar o fallback: quando não há módulos carregados e **não é ROOT**, retornar `false` (esconder por padrão) em vez de `true`

### Impacto
- Corrige Branch Admin, Operator e qualquer papel que tenha apenas `branch_id` no role
- Nenhuma alteração no banco de dados
- Um único arquivo modificado

