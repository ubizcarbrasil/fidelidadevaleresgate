

## Editar e Excluir Cidade na Página de Onboarding

### O que será feito

Adicionar botões de **Editar** e **Excluir** ao lado do seletor de cidade na página de Onboarding. Editar redireciona para o formulário existente (`/branches/:id`). Excluir abre um modal de confirmação e remove a cidade com todos os dados dependentes via backend.

### Plano

**1. Adicionar ação `delete_branch` na Edge Function `admin-brand-actions`**
- Nova action que recebe `branch_id`
- Limpa dados dependentes das mesmas tabelas do `delete_brand`, mas filtrando por `branch_id` em vez de `brand_id`
- Limpa referências em `profiles.selected_branch_id`
- Deleta a branch
- Permissão: brand_admin (dono da marca) ou root_admin

**2. Criar componente `AcoesCidade` em `src/features/city_onboarding/components/acoes_cidade.tsx`**
- Botão "Editar" (ícone Pencil) → navega para `/branches/{branchId}`
- Botão "Excluir" (ícone Trash2) → abre AlertDialog de confirmação
- No confirmar, chama a Edge Function com `action: "delete_branch"`
- Após sucesso, limpa o seletor e invalida queries

**3. Atualizar `PaginaOnboardingCidade`**
- Renderizar `AcoesCidade` ao lado do seletor quando uma cidade estiver selecionada
- Layout flexível: seletor + botões na mesma linha

### Arquivos

- **Editar**: `supabase/functions/admin-brand-actions/index.ts` — adicionar action `delete_branch`
- **Criar**: `src/features/city_onboarding/components/acoes_cidade.tsx` — botões editar/excluir com modal
- **Editar**: `src/features/city_onboarding/pagina_onboarding_cidade.tsx` — integrar `AcoesCidade`

