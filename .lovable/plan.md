

## Drag-and-drop para ordenação de categorias no admin

### O que muda
Substituir o campo numérico de "Ordem" na seção "Categorias Visíveis" do `DriverPanelConfigPage` por drag-and-drop. O admin arrasta as categorias para reordenar e o valor `order` é calculado automaticamente pela posição.

### Implementação

#### 1. Instalar `@dnd-kit/core` e `@dnd-kit/sortable`
Biblioteca leve e moderna de drag-and-drop para React, sem dependências pesadas.

#### 2. Refatorar a seção de categorias (`src/pages/DriverPanelConfigPage.tsx`)

- Ordenar as categorias pelo `order` atual do `categoryLayout` antes de renderizar.
- Envolver a lista com `DndContext` + `SortableContext` do dnd-kit.
- Cada item de categoria vira um componente `SortableItem` que usa `useSortable()`.
- Adicionar um ícone de "grip" (arrastar) à esquerda de cada linha — o `GripVertical` já está importado no arquivo.
- Remover o campo `Input type="number"` de ordem manual.
- No `onDragEnd`, recalcular os valores de `order` baseado na nova posição e salvar tudo de uma vez via `settingsMutation.mutate({ driver_category_layout: updated })`.

#### 3. Lógica do `onDragEnd`
```text
1. Identificar item arrastado (active) e destino (over)
2. Reordenar o array de categorias com arrayMove()
3. Gerar novo categoryLayout com order = index da posição
4. Salvar via settingsMutation
```

### Resultado
- O admin arrasta categorias para cima/baixo para definir a ordem de exibição
- O ícone de grip (`⠿`) aparece à esquerda de cada categoria
- A ordem é salva automaticamente ao soltar
- O campo numérico de ordem é removido (desnecessário com drag-and-drop)
- Controle de "Linhas" e "Ativo/Inativo" permanecem inalterados

