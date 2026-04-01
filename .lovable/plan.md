
# Criar Login e Senha do Franqueado no Provisionamento

## Problema
O provisionamento cria contas de teste para admin, cliente, parceiro e motorista, mas **não cria** conta para o franqueado (`branch_admin`). O card "Acessos de Teste" também não exibe label/ícone para esse papel.

## Alterações

### 1. `supabase/functions/provision-brand/index.ts`
Após a seção 11 (Driver test user, linha ~819), adicionar seção 12 — Franchisee test user:
- Email: `franqueado-{emailPrefix}@teste.com`
- Criar via `getOrCreateUser(email, "Franqueado Teste")` (2 parâmetros)
- Atualizar profile com `brand_id` e `tenant_id`
- Atribuir role `branch_admin` com `brand_id`, `branch_id` e `tenant_id`
- Criar `branch_points_wallet` via upsert com saldo 0
- Incluir `{ email: franqueadoEmail, role: "branch_admin", is_active: true }` no array `testAccounts`

### 2. `supabase/functions/provision-trial/index.ts`
Mesma lógica após seção 11 (linha ~664), adaptada ao `getOrCreateUser` do trial com 3 parâmetros:
- `getOrCreateUser(email, "123456", "Franqueado Teste")`
- Profile, role, wallet e testAccounts idênticos

### 3. `src/components/dashboard/DashboardQuickLinks.tsx`
Adicionar nos mapas existentes (linha 40-41):
- `roleLabel`: `branch_admin: "Franqueado"`
- `roleIcon`: `branch_admin: "🏙️"`

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/provision-brand/index.ts` | Nova seção franchisee + testAccounts |
| `supabase/functions/provision-trial/index.ts` | Mesma lógica (3 params) |
| `src/components/dashboard/DashboardQuickLinks.tsx` | Label e ícone para branch_admin |
