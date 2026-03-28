
# Estado vazio com link para Achadinhos na página Produtos de Resgate

## Problema
Quando não há produtos resgatáveis, a página mostra apenas "Nenhum produto resgatável encontrado" dentro da tabela — sem orientação sobre como ativar produtos.

## Solução
Substituir o estado vazio genérico da tabela por um componente visual dedicado com ícone, texto explicativo e botão que leva direto à página de Achadinhos com o filtro "Não resgatáveis".

## Alterações

### 1. `src/pages/ProdutosResgatePage.tsx`
- Quando `!isLoading && !items.length && !debouncedSearch` (sem busca ativa), renderizar **fora da tabela** um bloco de estado vazio contendo:
  - Ícone `Package` em destaque
  - Título: "Nenhum produto resgatável"
  - Descrição: "Ative produtos para resgate na página de Achadinhos usando o filtro 'Não resgatáveis'."
  - Botão com `Link` do react-router para `/achadinhos` — "Ir para Achadinhos"
- Ocultar a tabela, KPIs e controles quando o estado vazio sem busca estiver ativo
- Manter o estado vazio inline na tabela quando houver busca sem resultados (filtro ativo)
