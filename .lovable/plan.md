
# Criar Login e Senha do Franqueado no Provisionamento

## Problema
O provisionamento cria contas de teste para admin, cliente, parceiro e motorista, mas **não cria** conta para o franqueado (`branch_admin`). O card "Acessos de Teste" também não exibe label/ícone para esse papel.

## Alterações

### 1. `supabase/functions/provision-brand/index.ts`
Após a seção 11 (Driver test user, linha ~820), adicionar seção "Franchisee test user":
- Email: `franqueado-{emailPrefix}@teste.com`
- Criar via `getOrCreateUser(email, "Franqueado Teste")` (2 parâmetros)
- Atualizar profile com `brand_id` e `tenant_id`
- Atribuir role `branch_admin` com `brand_id`, `branch_id` e `tenant_id` via `user_roles.upsert`
- Criar `branch_points_wallet` via upsert (saldo 0)
- Incluir `{ email, role: "branch_admin", is_active: true }` no array `testAccounts` (linha ~827)

### 2. `supabase/functions/provision-trial/index.ts`
Mesma lógica após seção 11 (linha ~664), adaptada ao `getOrCreateUser` do trial (3 parâmetros: email, password, name):
- `getOrCreateUser(email, "123456", "Franqueado Teste")`
- Restante idêntico (profile, role, wallet, testAccounts na linha ~672)

### 3. `src/components/dashboard/DashboardQuickLinks.tsx`
Adicionar nos mapas existentes (linha ~40):
- `roleLabel`: `branch_admin: "Franqueado"`
- `roleIcon`: `branch_admin: "🏙️"`

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/provision-brand/index.ts` | Nova seção franchisee + incluir no testAccounts |
| `supabase/functions/provision-trial/index.ts` | Mesma lógica (3 params) |
| `src/components/dashboard/DashboardQuickLinks.tsx` | Label e ícone para branch_admin |
