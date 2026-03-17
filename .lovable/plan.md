

## Plano: Gestão de Acessos pelo Empreendedor (Brand Admin)

### Objetivo
Permitir que o brand_admin crie novos usuários para seu painel e defina permissões granulares para cada um, usando a infraestrutura existente de `user_permission_overrides` e `permissions`.

### Situação Atual
- **UsersPage** permite atribuir roles existentes a usuários já cadastrados, mas não cria novos usuários
- A tabela `user_permission_overrides` já existe e suporta overrides por usuário/permissão
- A tabela `permissions` já tem todas as permissões cadastradas com módulo/key
- A função `user_has_permission()` já consulta overrides + role_permissions
- Falta uma Edge Function para criar usuários (signup server-side) e uma UI para o brand_admin gerenciar tudo

---

### Alterações

#### 1. Edge Function `invite-brand-user`
Criar `supabase/functions/invite-brand-user/index.ts` que:
- Recebe `{ email, full_name, role, brand_id, branch_id?, permissions[] }`
- Valida que o caller é brand_admin da marca informada
- Usa `auth.admin.createUser()` para criar o usuário (ou encontrar existente)
- Insere `user_roles` com a role escolhida + brand_id/branch_id
- Insere `user_permission_overrides` para cada permissão selecionada
- Registrar no `config.toml` com `verify_jwt = false`

#### 2. Refatorar `UsersPage.tsx` para Brand Admins
Reformular a página para o contexto do empreendedor:
- **Listagem**: Cards com nome, email, role, status e quantidade de permissões
- **Botão "Convidar Usuário"**: Dialog com formulário (nome, email, role) + checklist de permissões
- **Editar Permissões**: Dialog por usuário mostrando todas as permissões da marca como checkboxes agrupadas por módulo
- Roles disponíveis para brand_admin: `branch_admin`, `branch_operator`, `operator_pdv`
- Manter comportamento atual para ROOT (tabela existente)

#### 3. Componente `UserPermissionsDialog`
Criar componente reutilizável que:
- Recebe `userId` e `brandId`
- Busca permissões disponíveis (`permissions` table) e overrides atuais do usuário
- Agrupa por módulo com checkboxes
- Salva via upsert/delete em `user_permission_overrides`

#### 4. Migração SQL
- Adicionar policy RLS em `user_permission_overrides` para brand_admin poder ler/escrever overrides de usuários dentro da sua marca (via join com `user_roles`)

---

### Fluxo do Empreendedor

```text
Página "Equipe & Acessos"
├── Lista de usuários da marca (cards)
│   ├── Nome, email, role badge
│   ├── Botão "Editar Permissões" → abre dialog com checkboxes por módulo
│   └── Botão "Remover acesso"
└── Botão "Convidar Usuário"
    ├── Form: Nome, Email, Função (branch_admin/operator/pdv)
    ├── Seleção de Cidade (se aplicável)
    ├── Checklist de permissões agrupadas por módulo
    └── Botão "Enviar Convite" → chama Edge Function
```

### Arquivos Envolvidos
- **Criar**: `supabase/functions/invite-brand-user/index.ts`
- **Criar**: `src/components/UserPermissionsDialog.tsx`
- **Editar**: `src/pages/UsersPage.tsx` (refatorar para brand_admin UX)
- **Editar**: `supabase/config.toml` (registrar nova Edge Function)
- **Migração**: RLS policy em `user_permission_overrides` para brand_admin

