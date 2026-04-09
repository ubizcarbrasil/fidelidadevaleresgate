

# Adicionar botão de recarga de pontos no painel da cidade

## Problema
O componente `BranchVisaoGeral` (visão geral da cidade no dashboard) mostra o saldo da carteira, total carregado e distribuído, mas não oferece nenhuma ação para adicionar pontos. A funcionalidade de recarga já existe na página dedicada `/branch-wallet` (`BranchWalletPage.tsx`), mas o empreendedor não tem acesso direto a ela pelo dashboard da cidade.

## Solução
Adicionar um botão "Recarregar" diretamente no card `BranchVisaoGeral` do dashboard da cidade, com um dialog inline para inserir quantidade e descrição — reutilizando a mesma lógica que já existe em `BranchWalletPage`.

## Alterações

### 1. Atualizar `BranchVisaoGeral` com botão de recarga
- Adicionar props `branchId` e `brandId` ao componente
- Adicionar estado local para o dialog de recarga (quantidade, descrição)
- Implementar mutation de recarga (mesma lógica de `BranchWalletPage`)
- Renderizar botão "Recarregar" no header do card, visível apenas para escopos ROOT/BRAND/TENANT
- Incluir Dialog com input de pontos e textarea de descrição

### 2. Atualizar `BranchDashboardSection`
- Passar `branchId` e `brandId` como props para `BranchVisaoGeral`

### 3. Atualizar `Dashboard.tsx`
- Garantir que o `brandId` está disponível e passado corretamente ao `BranchDashboardSection`

### Arquivos alterados
- `src/components/dashboard/branch/BranchVisaoGeral.tsx` — adicionar dialog de recarga
- `src/components/dashboard/BranchDashboardSection.tsx` — passar props extras
- `src/components/dashboard/branch/tipos_branch_dashboard.ts` — verificar se o tipo já tem os campos necessários

