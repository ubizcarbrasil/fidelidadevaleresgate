

## Diagnóstico

A seção "Melhores" com template `OFFERS_CAROUSEL` está configurada no banco com `rows_count = 2`. Quando `rows_count > 1`, o código usa CSS Grid com `gridTemplateRows: repeat(2, 1fr)` e `gridAutoFlow: column`, o que empilha os cards verticalmente em 2 linhas dentro de cada coluna — causando o layout em coluna que você vê na screenshot.

## Solução

1. **Corrigir no banco**: Atualizar o `rows_count` da seção "Melhores" (OFFERS_CAROUSEL) de `2` para `1`, fazendo os cards voltarem ao layout de carrossel horizontal (`flex` + `overflow-x-auto`).

2. **Garantia no código**: Nenhuma alteração de código necessária — o `OffersCarousel` já renderiza corretamente em carrossel horizontal quando `rowsCount = 1`.

A seção `MANUAL_LINKS_GRID` com título "Melhores" não é afetada (outro template).

