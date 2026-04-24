## Permitir reativar itens ocultos direto na pré-visualização

Hoje, na pré-visualização do Produto Comercial, itens cujo módulo não está selecionado aparecem com o badge "OCULTO" mas só podem ser reativados voltando ao passo 3 (Funcionalidades). A ideia é permitir reativar com um clique ali mesmo, espelhando o comportamento do "X" que já remove.

### O que muda visualmente

- Cada item oculto (com `moduleDefinitionId` válido) ganha um botão "+" (ícone `Plus`, verde) no mesmo lugar onde hoje aparece o "X" para os itens ativos.
- Ao clicar no "+", o módulo é adicionado de volta ao produto e o item passa a aparecer normal.
- Toast de confirmação: "Item reativado no produto" com ação "Desfazer" (igual ao fluxo de remover).
- Itens de núcleo (sem módulo associado) seguem mostrando o cadeado — não são afetados.
- Itens ocultos cujo módulo não foi encontrado no banco continuam apenas com o rótulo "OCULTO" sem ação (caso raro).

### Ação nova no grupo

- No header do grupo, ao lado do botão de remover (lixeira), adicionar um botão "Ativar todos" (ícone `PlusCircle`):
  - Habilitado apenas quando o grupo tem ao menos 1 item oculto com `moduleDefinitionId` válido.
  - Reativa todos os módulos ocultos do grupo de uma vez.
  - Toast: `Grupo "X" reativado (N itens)` com Desfazer.

### Texto do cabeçalho

Atualizar a explicação no topo do passo de pré-visualização para mencionar a reativação:

> "Use ↑ ↓ para reordenar, X para remover do produto e + para reativar itens ocultos."

### Arquivos a alterar

- `src/features/produtos_comerciais/hooks/hook_layout_sidebar_produto.ts`
  - Adicionar `reativarItem(moduleDefinitionId)` e `reativarGrupo(grupoLabel)` que adicionam ids a `draft.module_definition_ids` (sem duplicar). Retornam os ids efetivamente adicionados para suportar Desfazer (que removeria de novo).

- `src/features/produtos_comerciais/components/preview_sidebar_item.tsx`
  - Quando `!moduleAtivo && moduleDefinitionId`, renderizar botão "+" com cor verde no lugar do espaço vazio atual.
  - Nova prop `onReativar: () => void`.

- `src/features/produtos_comerciais/components/preview_sidebar_grupo.tsx`
  - Calcular `reativaveis` (itens ocultos com `moduleDefinitionId`).
  - Adicionar botão "Ativar todos" no header quando `reativaveis > 0`.
  - Nova prop `onReativarItem` e `onReativarGrupo`, passar para os filhos.

- `src/features/produtos_comerciais/components/passo_preview.tsx`
  - Handlers `handleReativarItem` e `handleReativarGrupo` análogos aos de remoção.
  - Atualizar texto do cabeçalho.

- `src/features/produtos_comerciais/__tests__/layout_sidebar.test.ts`
  - Adicionar 2 testes: reativar item adiciona id e não duplica; reativar grupo adiciona apenas os ids ainda não selecionados.

### Comportamento garantido

- Reativar um item aqui é equivalente a marcá-lo de volta no passo 3 — mesma fonte de verdade (`module_definition_ids`).
- Não muda o layout/ordem salvo (`sidebar_layout`); a ordem do item é a mesma de antes.
- Desfazer no toast remove o(s) id(s) recém-adicionado(s).
