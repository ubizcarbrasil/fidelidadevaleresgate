# Criar Login e Senha do Franqueado (branch_admin) no Provisionamento

## Problema
O provisionamento cria contas de teste para admin, cliente, parceiro e motorista, mas **não cria** uma conta de teste para o franqueado (`branch_admin`). Também não aparece no card "Acessos de Teste" do dashboard.

## O que será feito

### 1. Provisioning — `provision-brand/index.ts`
Após a criação do motorista (seção 11), adicionar seção para criar o usuário franqueado de teste:
- Email: `franqueado-{emailPrefix}@teste.com`, senha: `123456`
- Criar via `getOrCreateUser`
- Atribuir role `branch_admin` com `brand_id`, `branch_id` e `tenant_id`
- Adicionar ao array `testAccounts` com `{ email, role: "branch_admin", is_active: true }`
- Criar carteira de pontos (`branch_points_wallet`) com saldo inicial 0

### 2. Provisioning — `provision-trial/index.ts`
Mesma lógica acima adaptada para o fluxo trial.

### 3. Quick Links — `DashboardQuickLinks.tsx`
- Adicionar label e ícone para `branch_admin` no mapa de roles: `{ branch_admin: "Franqueado" }` e `{ branch_admin: "🏙️" }`
- O card já renderiza todos os test_accounts ativos, então o franqueado aparecerá automaticamente

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/provision-brand/index.ts` | Nova seção "Franchisee test user" + incluir no testAccounts |
| `supabase/functions/provision-trial/index.ts` | Mesma lógica |
| `src/components/dashboard/DashboardQuickLinks.tsx` | Adicionar label/ícone para branch_admin |
