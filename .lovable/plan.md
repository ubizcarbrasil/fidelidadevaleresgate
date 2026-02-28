

# VALE RESGATE — Plano de Implementação

## Fase 1: Backend (Lovable Cloud / Supabase)

### 1. Criar tabelas no banco de dados
- **tenants**: id, name, slug, is_active, plan, created_at
- **brands**: id, tenant_id (FK), name, slug, is_active, default_theme_id, brand_settings_json
- **branches**: id, brand_id (FK), name, slug, city, state, timezone, is_active, branch_settings_json
- **user_roles**: id, user_id (FK auth.users), role (enum: root_admin, tenant_admin, brand_admin, branch_admin, branch_operator), tenant_id, brand_id, branch_id — escopo do role
- **profiles**: id (FK auth.users), full_name, email, avatar_url, created_at

### 2. Configurar RLS e função de segurança
- Função `has_role()` (security definer) para checar permissões sem recursão
- Políticas RLS por nível hierárquico:
  - ROOT_ADMIN: acesso total
  - Tenant Admin: acesso apenas ao seu tenant
  - Brand Admin: acesso apenas à sua brand
  - Branch Admin/Operator: acesso apenas ao seu branch

### 3. Configurar autenticação
- Signup/Login com email e senha
- Trigger para criar perfil automaticamente no signup
- Página de reset de senha

## Fase 2: Frontend

### 4. Layout base e navegação
- Sidebar com navegação hierárquica (Platform → Tenants → Brands → Branches)
- Header com info do usuário e logout
- Proteção de rotas por autenticação

### 5. Páginas de autenticação
- Login, Signup, Forgot Password, Reset Password

### 6. Dashboard ROOT_ADMIN
- Visão geral: total de tenants, brands, branches ativos
- Cards com métricas resumidas

### 7. CRUD de Tenants
- Listagem com filtros (ativo/inativo)
- Criar/editar tenant (nome, slug, plano, status)
- Ativar/desativar tenant

### 8. CRUD de Brands
- Listagem filtrada por tenant selecionado
- Criar/editar brand (nome, slug, status, settings)
- Ativar/desativar brand

### 9. CRUD de Branches
- Listagem filtrada por brand selecionada
- Criar/editar branch (nome, slug, cidade, estado, timezone, status, settings)
- Ativar/desativar branch

### 10. Gestão de usuários e roles
- Listar usuários e seus roles
- Atribuir/remover roles com escopo (tenant, brand ou branch)

