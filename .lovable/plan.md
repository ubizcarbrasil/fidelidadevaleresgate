

## Corrigir layout mobile da tela de Gamificação Admin

### Problema
A tela `/gamificacao-admin` foi construída com layout desktop (tabela com 6 colunas, tabs com `grid-cols-5`, header com elementos lado a lado). Em viewport mobile (430px), tudo fica espremido e deformado.

### Correções

**1. `GamificacaoAdminPage.tsx` — Header e seletor de cidade**
- Header: empilhar título e seletor de cidade em coluna no mobile (`flex-col` em mobile, `flex-row` em md+)
- Seletor de branch: largura total no mobile (`w-full` em mobile, `w-auto min-w-[160px]` em md+)

**2. `GamificacaoAdminPage.tsx` — Tabs responsivas**
- Trocar `grid grid-cols-5` por tabs com scroll horizontal no mobile: `flex overflow-x-auto` no mobile, `grid grid-cols-5` em md+
- Cada tab com `whitespace-nowrap` e tamanho menor no mobile

**3. `DuelosAoVivoAdmin.tsx` — Card de duelo ao vivo**
- Header do card: empilhar título e botão "Criar Duelo" em coluna no mobile
- Card interno do duelo: nomes dos motoristas com `truncate` e `max-w` limitado
- Countdown e badge: empilhar verticalmente em telas estreitas
- Botão "Impulsionar" e data: empilhar em coluna no mobile

**4. `ListaDuelosAdmin.tsx` — Tabela de duelos**
- Substituir a `Table` por cards empilhados no mobile (padrão card-list)
- Cada duelo vira um card com informações empilhadas: nomes, status badge, período, placar e prêmio
- Manter a Table apenas em `md+` via `hidden md:block` / `md:hidden`

**5. `EstatisticasGamificacao.tsx`**
- Já usa `grid-cols-2 md:grid-cols-4` — está ok, manter

**6. `ModalCriarDueloAdmin.tsx` e `ModalImpulsionarDuelo.tsx`**
- Adicionar `max-h-[85vh] overflow-y-auto` no DialogContent para não estourar em telas pequenas

### Arquivos a editar
- `src/pages/GamificacaoAdminPage.tsx`
- `src/components/admin/gamificacao/DuelosAoVivoAdmin.tsx`
- `src/components/admin/gamificacao/ListaDuelosAdmin.tsx`
- `src/components/admin/gamificacao/ModalCriarDueloAdmin.tsx`
- `src/components/admin/gamificacao/ModalImpulsionarDuelo.tsx`

