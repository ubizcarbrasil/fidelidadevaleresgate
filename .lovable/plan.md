

## Botão "Reprocessar Pontos" no painel de cidades

### O que será feito
Adicionar um botão "Reprocessar Pontos" na listagem de cidades (`BrandBranchesPage.tsx`), ao lado dos botões existentes ("Criar Franqueado", "Resetar pontos", "Editar"). Ao clicar, abre um dialog de confirmação e chama a RPC `reprocess_missing_driver_points` já existente no banco.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/branch/DialogReprocessarPontos.tsx` | **Novo** — Dialog de confirmação com feedback do resultado (quantos pontos reprocessados/ignorados) |
| `src/pages/BrandBranchesPage.tsx` | Importar o novo dialog, adicionar estado para controlar abertura, e botão "Reprocessar Pontos" na linha de ações de cada cidade |

### Detalhes técnicos
- O dialog chamará `supabase.rpc('reprocess_missing_driver_points', { p_branch_id })` 
- Exibirá resultado com quantidade de corridas processadas e ignoradas
- Botão com ícone `RefreshCw` e label "Reprocessar Pontos"
- Loading state durante execução
- Toast de sucesso/erro ao finalizar

