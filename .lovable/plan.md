

# Corrigir Atribuição de Role do Franqueado

## Problema
A Edge Function `create-branch-admin` usa `upsert` com `onConflict: "user_id,role"`, mas a constraint real da tabela `user_roles` é `UNIQUE(user_id, role, tenant_id, brand_id, branch_id)`. Isso faz o upsert falhar silenciosamente — o perfil é atualizado e a carteira é criada, mas a role `branch_admin` nunca é inserida.

**Usuário afetado:** `franqueado@ubizcar.com.br` (id: `ac826b3b-...`) — perfil OK, carteira OK, mas sem role `branch_admin`.

## Correção

### 1. `supabase/functions/create-branch-admin/index.ts` (linha ~117-127)
Substituir o `upsert` por um fluxo de `insert` + tratamento de conflito:

```typescript
// Upsert role — match full unique constraint
await supabaseAdmin.from("user_roles").upsert(
  {
    user_id: userId,
    role: "branch_admin",
    brand_id,
    branch_id,
    tenant_id: effectiveTenantId,
  },
  { onConflict: "user_id,role,tenant_id,brand_id,branch_id", ignoreDuplicates: true },
);
```

### 2. Deploy e re-executar
- Fazer deploy da função corrigida
- Chamar a função novamente para o usuário existente para inserir a role que ficou faltando

### 3. Provisioning functions (mesma correção)
Verificar e corrigir o mesmo `onConflict` em:
- `supabase/functions/provision-brand/index.ts`
- `supabase/functions/provision-trial/index.ts`

## Resultado esperado
O franqueado `franqueado@ubizcar.com.br` terá:
- ✅ Perfil com `brand_id` e `tenant_id`
- ✅ Role `branch_admin` vinculada a São João da Boa Vista
- ✅ Carteira de pontos inicializada
- Senha: `123456`

