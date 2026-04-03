

# Corrigir Sidebar do Franqueado — Labels e Filtragem por Modelo

## Problemas Identificados

### 1. Labels aparecendo como chaves brutas
Os itens do sidebar do franqueado mostram `sidebar.regras_motorista`, `sidebar.carteira_pontos`, `sidebar.relatorios_cidade`, `sidebar.manuais` em vez dos nomes legíveis. Isso acontece porque essas chaves não existem no mapa `DEFAULT_LABELS` em `useMenuLabels.ts`.

### 2. Filtragem por scoring model
O `BranchSidebar` já possui a lógica de filtragem por `scoringFilter` usando o hook `useBranchScoringModel`. No entanto, o hook depende de `currentBranchId` do `useBrandGuard`, que pode não estar resolvendo corretamente para o branch_admin. Preciso validar e garantir que funciona.

## Solução

### 1. Adicionar labels faltantes em `useMenuLabels.ts`
Adicionar ao `DEFAULT_LABELS.admin`:
- `sidebar.carteira_pontos` → "Carteira de Pontos"
- `sidebar.regras_motorista` → "Regras de Pontuação"
- `sidebar.relatorios_cidade` → "Relatórios"
- `sidebar.manuais` → "Manuais"
- `sidebar.motoristas` → "Motoristas" (verificar se já existe)

### 2. Garantir que a filtragem funciona
- Verificar se `useBranchScoringModel` resolve o `branchId` corretamente
- Se o `branchId` não estiver disponível via roles, adicionar fallback consultando a branch associada ao usuário
- Testar que grupos DRIVER/PASSENGER são ocultados conforme o `scoring_model` da cidade

### Arquivos a modificar
- `src/hooks/useMenuLabels.ts` — adicionar labels faltantes
- `src/hooks/useBranchScoringModel.ts` — validar/corrigir resolução do branchId (se necessário)

