

## Adicionar botão "Criar Franqueado" nos cards de cidade

### O que será feito

1. **Criar componente `DialogCriarFranqueado`** em `src/components/branch/DialogCriarFranqueado.tsx`
   - Dialog com campos: email, senha, nome completo (opcional)
   - Ao submeter, chama `supabase.functions.invoke("create-branch-admin", { body: { email, password, full_name, brand_id, branch_id } })`
   - Mostra loading no botão, toast de sucesso/erro
   - Fecha o dialog ao concluir

2. **Adicionar botão no card** em `BrandBranchesPage.tsx`
   - Novo botão "Criar Franqueado" com ícone `UserPlus` na linha de ações de cada card (ao lado de "Resetar pontos" e "Editar")
   - State para controlar qual branch está com o dialog aberto
   - Passa `brand_id` e `branch_id` para o dialog

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/branch/DialogCriarFranqueado.tsx` | Criar |
| `src/pages/BrandBranchesPage.tsx` | Adicionar botão + state + import do dialog |

### Detalhes técnicos

- A edge function `create-branch-admin` já existe e aceita `{ email, password, full_name, brand_id, branch_id }` — não precisa de alteração
- O dialog usará componentes existentes: `Dialog`, `Input`, `Button`, `Label`
- Validação client-side: email obrigatório, senha mínimo 6 caracteres

