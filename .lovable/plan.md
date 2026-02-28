

## Regra de Pontuação Personalizável por Loja

### 1. Migração de Banco de Dados

**A) Adicionar colunas em `points_rules`:**
- `allow_store_custom_rule` (bool, default false)
- `store_points_per_real_min` (decimal, default 1.0)
- `store_points_per_real_max` (decimal, default 3.0)
- `store_rule_requires_approval` (bool, default true)

**B) Criar enum `store_rule_status`:** `ACTIVE`, `PENDING_APPROVAL`, `REJECTED`

**C) Criar tabela `store_points_rules`:**
- `id`, `brand_id`, `branch_id`, `store_id`, `points_per_real` (decimal), `starts_at` (nullable), `ends_at` (nullable), `is_active` (bool), `status` (store_rule_status), `created_by_user_id`, `created_at`, `approved_by_user_id` (nullable), `approved_at` (nullable)

**D) RLS para `store_points_rules`:**
- ROOT: ALL
- Brand/Branch admins: SELECT, UPDATE (approve/reject) filtrado por brand/branch
- Store admins: SELECT próprias, INSERT (filtrado por branch)

### 2. Lógica de Cálculo (EarnPointsPage)

Alterar `src/pages/EarnPointsPage.tsx`:
- Após buscar a `rule` base, verificar se `allow_store_custom_rule === true`
- Se sim, buscar `store_points_rules` ativa/aprovada para o `store_id` selecionado com datas válidas
- Se encontrar, usar o `points_per_real` da store rule (clampado entre min/max da rule base)
- Caso contrário, manter o `points_per_real` da regra base
- Exibir indicador visual quando usando regra customizada da loja

### 3. UI do Lojista — "Minha Regra de Pontuação"

Criar `src/pages/StorePointsRulePage.tsx`:
- Mostrar regra base do programa (somente leitura)
- Se `allow_store_custom_rule` habilitado:
  - Campo para ajustar `points_per_real` (slider/input entre min/max)
  - Campos opcionais de período promocional (starts_at / ends_at)
  - Botão Salvar
- Se `store_rule_requires_approval`: salvar como `PENDING_APPROVAL`, exibir badge "Aguardando aprovação"
- Se não: salvar como `ACTIVE`
- Mostrar histórico de regras da loja

### 4. UI do Branch Admin — "Aprovar Regras de Lojas"

Criar `src/pages/ApproveStoreRulesPage.tsx`:
- Listar `store_points_rules` com `status = PENDING_APPROVAL` filtradas pelo branch
- Para cada: nome da loja, `points_per_real` solicitado, período, data de criação
- Botões Aprovar / Rejeitar
- Ao aprovar: `status = ACTIVE`, `approved_by_user_id`, `approved_at`
- Ao rejeitar: `status = REJECTED`
- Registrar auditoria em `audit_logs`

### 5. Atualizar PointsRulesPage

Adicionar os 4 novos campos ao formulário de criação/edição de regras:
- Switch "Permitir regra customizada por loja"
- Inputs para min/max de `points_per_real` por loja
- Switch "Requer aprovação"

### 6. Rotas e Navegação

- Adicionar rota `/store-points-rule` (protegida por ModuleGuard `earn_points_store`)
- Adicionar rota `/approve-store-rules` (protegida por ModuleGuard `earn_points_store`)
- Adicionar links na sidebar do Branch (`BranchSidebar`) e criar/atualizar sidebar para Store Admin
- Condicionar visibilidade dos links na sidebar ao `allow_store_custom_rule`

### Arquivos Afetados

| Ação | Arquivo |
|------|---------|
| Migração SQL | Nova migration (alter points_rules, create store_points_rules) |
| Editar | `src/pages/PointsRulesPage.tsx` (4 novos campos no form) |
| Editar | `src/pages/EarnPointsPage.tsx` (lógica de cálculo com store rule) |
| Criar | `src/pages/StorePointsRulePage.tsx` |
| Criar | `src/pages/ApproveStoreRulesPage.tsx` |
| Editar | `src/App.tsx` (2 novas rotas) |
| Editar | `src/components/consoles/BranchSidebar.tsx` (link aprovação) |

