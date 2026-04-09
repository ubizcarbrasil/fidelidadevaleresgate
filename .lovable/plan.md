

# Módulos de Negócio por Cidade

## Resumo
Adicionar 5 toggles de módulos de negócio no formulário de criação/edição de cidade (`BrandBranchForm`), armazenados no `branch_settings_json`. O sidebar do franqueado e o dashboard passam a respeitar esses toggles, ocultando funcionalidades desativadas.

## Módulos

| Chave no `branch_settings_json` | Nome no UI | Controla |
|---|---|---|
| `enable_duels_module` | Módulo Duelo | Grupo "Gamificação" no sidebar + Arena no dashboard |
| `enable_achadinhos_module` | Módulo Achadinho | Grupo "Achadinhos" no sidebar |
| `enable_marketplace_module` | Módulo Mercado Livre | Vitrine do marketplace do motorista |
| `enable_race_earn_module` | Módulo Corra e Ganhe Pontos | Grupo "Motoristas & Resgate" no sidebar |
| `enable_customer_scoring_module` | Módulo Cliente Pontua | Grupos "Gestão Comercial", "Programa de Fidelidade", "Aprovações" no sidebar |

## Alterações

### 1. `BrandBranchForm.tsx` — Novo card "Módulos de Negócio"
- Adicionar 5 estados booleanos (todos `true` por padrão)
- Carregar valores existentes do `branch_settings_json` no `useEffect`
- Salvar no merge do `branchSettingsJson` no `handleSave`
- Renderizar card com 5 switches entre o card de Gamificação e o de Modelo de Pontuação, cada um com nome, descrição e ícone

### 2. Hook `useBranchModules.ts` (novo)
- Recebe `branchId` opcional (ou usa o do `useBrandGuard`)
- Consulta `branches.branch_settings_json` para o branch
- Retorna `{ isBranchModuleEnabled(key): boolean, isLoading }`
- Módulos são `true` por padrão (opt-out) para retrocompatibilidade

### 3. `BranchSidebar.tsx` — Filtrar grupos por módulos da cidade
- Importar `useBranchModules`
- Adicionar campo `branchModuleKey` nos grupos relevantes:
  - "Gamificação" → `enable_duels_module`
  - "Achadinhos" → `enable_achadinhos_module`
  - "Motoristas & Resgate" → `enable_race_earn_module`
  - "Gestão Comercial", "Aprovações", "Programa de Fidelidade" → `enable_customer_scoring_module`
- Filtrar grupos onde `branchModuleKey` está desativado

### 4. `BranchDashboardSection.tsx` — Respeitar módulos
- Importar `useBranchModules`
- Condicionar `BranchArenaDuelos` a `enable_duels_module`
- Condicionar KPIs de motorista a `enable_race_earn_module`

### Arquivos criados/alterados
- `src/hooks/useBranchModules.ts` — **novo** hook
- `src/pages/BrandBranchForm.tsx` — novo card de módulos + persistência
- `src/components/consoles/BranchSidebar.tsx` — filtrar por módulos da cidade
- `src/components/dashboard/BranchDashboardSection.tsx` — condicionar componentes

### Retrocompatibilidade
Todos os módulos são `true` por padrão quando não configurados no `branch_settings_json`. Cidades existentes continuam funcionando normalmente sem necessidade de migração.

