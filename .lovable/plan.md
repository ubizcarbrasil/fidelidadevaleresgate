

## Correção: Painel da cidade mostrando cidades de outras filiais

### Causa

A página `src/pages/Branches.tsx` (rota `/branches`) filtra apenas por `brand_id`, mas não aplica filtro de `branch_id`. Quando um franqueado (branch admin) de Araxá acessa essa página, vê todas as cidades da marca (Leme e Araxá), quando deveria ver apenas a sua.

### Correção

**Arquivo:** `src/pages/Branches.tsx` (linha 29)

Adicionar filtro de `branch_id` usando `applyBranchFilter` do `useBrandGuard`, que já existe e faz exatamente isso — aplica `eq("branch_id", currentBranchId)` para usuários não-root que têm branch_id definido.

```typescript
// ANTES (linha 28-29)
let query = supabase.from("branches").select("*, brands(name, tenants(name))", { count: "exact" });
if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);

// DEPOIS
const { currentBrandId, currentBranchId, isRootAdmin } = useBrandGuard();
// ...
let query = supabase.from("branches").select("*, brands(name, tenants(name))", { count: "exact" });
if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);
if (!isRootAdmin && currentBranchId) query = query.eq("id", currentBranchId);
```

Note: o filtro usa `eq("id", currentBranchId)` porque estamos filtrando a própria tabela `branches` — o `id` da branch é o campo correto, não `branch_id`.

### Resultado

| Usuário | Antes | Depois |
|---------|-------|--------|
| Root admin | Vê todas as cidades | Sem mudança |
| Brand admin | Vê todas as cidades da marca | Sem mudança |
| Branch admin (Araxá) | Vê Leme + Araxá | Vê apenas Araxá |

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Branches.tsx` | Adicionar `currentBranchId` e filtrar `eq("id", currentBranchId)` para branch admins |

