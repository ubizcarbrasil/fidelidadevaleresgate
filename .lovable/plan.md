

## Reset de Pontos Granular — Motorista, Cliente ou Todos

### Objetivo
Evoluir o reset de pontos da cidade para permitir escolher: zerar **todos**, apenas **motoristas**, apenas **clientes**, ou um **indivíduo específico**.

### Arquivos

**1. Nova action `reset_branch_points` em `supabase/functions/admin-brand-actions/index.ts`**
- Recebe: `branch_id`, `target` (`"all"` | `"drivers"` | `"clients"` | `"single"`), `customer_id?` (quando `target = "single"`)
- Autorização: brand_admin da marca ou root_admin
- Lógica:
  - `all` → zera `points_balance` de todos os customers da branch
  - `drivers` → zera apenas onde `name ILIKE '%[MOTORISTA]%'`
  - `clients` → zera apenas onde `name NOT ILIKE '%[MOTORISTA]%'`
  - `single` → zera apenas o `customer_id` informado
- Para cada customer com saldo > 0, insere um DEBIT no `points_ledger` com `reference_type = 'BRANCH_RESET'`
- Cancela duelos ativos e side bets abertas/matched da branch (quando target = all/drivers)
- Retorna contagem de afetados

**2. Novo componente `src/components/branch/DialogResetPontos.tsx`**
- Dialog/Sheet com 3 opções via RadioGroup:
  - "Todos os pontos" (motoristas + clientes)
  - "Apenas motoristas"
  - "Apenas clientes"
  - "Motorista/cliente específico" → exibe campo de busca por nome/CPF
- Campo de busca com autocomplete que consulta `customers` da branch
- Botão "Resetar" com variante destructive
- ConfirmDialog aninhado com aviso irreversível antes de executar

**3. Modificação em `src/pages/BrandBranchesPage.tsx`**
- Adicionar botão `RotateCcw` em cada card de cidade
- Ao clicar, abre o `DialogResetPontos` passando `branch_id`
- Toast de sucesso com contagem de afetados

### Fluxo do Usuário
```text
Card da cidade → [⟲] → Dialog abre
  ○ Todos
  ○ Apenas motoristas
  ○ Apenas clientes
  ○ Específico → [Buscar por nome/CPF] → Selecionar
→ [Resetar Pontos] → Confirmação destructive → Executar → Toast "X registros zerados"
```

### Detalhes Técnicos
- Busca de customers usa query filtrada por `branch_id` com limit 20
- O campo de busca filtra por `name` ou `cpf` (ilike)
- Reutiliza `ConfirmDialog` existente com variante destructive
- Auditabilidade garantida via `points_ledger` com reason descritivo por tipo de reset

