

## Plano: Tornar a página Taxonomia responsiva para mobile

### Problema
A página de Taxonomia (`TaxonomyPage.tsx`) usa layout `grid-cols-1 lg:grid-cols-4` que no mobile empilha corretamente, mas os controles internos não são otimizados para telas pequenas — o campo de busca tem largura fixa (`w-60`), botões de ação ficam escondidos atrás de `hover:opacity` (impossível em touch), e o painel de categorias ocupa muito espaço vertical.

### Correção — `src/pages/TaxonomyPage.tsx`

1. **Categorias em scroll horizontal no mobile**: no mobile, renderizar as categorias como chips/pills horizontais com scroll em vez de lista vertical longa
2. **Busca responsiva**: trocar `w-60` por `w-full` no mobile
3. **Botões de ação sempre visíveis no mobile**: remover `opacity-0 group-hover:opacity-100` em telas touch, usar `sm:opacity-0 sm:group-hover:opacity-100`
4. **Header dos segmentos**: empilhar título e controles verticalmente no mobile (`flex-col` em telas pequenas)
5. **Badges de aliases**: limitar a 4 no mobile para evitar overflow

### Arquivo
- `src/pages/TaxonomyPage.tsx`

