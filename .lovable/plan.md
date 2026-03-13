

## Mostrar todas as seções ativas mesmo sem conteúdo

### Problema

Existem **duas regras** no `HomeSectionsRenderer.tsx` que escondem seções ativas:

1. **Linha 402-404**: Se o número de resultados for menor que `min_stores_visible`, os resultados são zerados
2. **Linha 438**: Se `items.length === 0`, a seção retorna `null` (não renderiza nada)

Isso faz com que seções habilitadas fiquem invisíveis quando não têm conteúdo suficiente.

### Correção

**Arquivo**: `src/components/HomeSectionsRenderer.tsx`

1. **Remover a regra de `min_stores_visible`** (linhas 402-404) — não zerar mais os resultados quando há poucos itens
2. **Remover o `return null` quando items vazio** (linha 438) — renderizar a seção mesmo sem itens, mostrando o título/subtítulo com um estado vazio (ex: "Nenhum item disponível")

Assim, toda seção marcada como ativa (`is_enabled = true`) será sempre exibida na home, independentemente de ter conteúdo ou não.

