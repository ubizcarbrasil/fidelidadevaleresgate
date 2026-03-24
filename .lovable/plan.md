

## Problema: Limite de ofertas visíveis no Achadinhos

### Causa raiz

Dois limites estão impedindo a visualização de todas as ofertas:

1. **Query com `.limit(50)`** (linha 135): a busca no banco traz no máximo 50 deals no total, divididos entre TODAS as categorias. "Casa" pode ter 52, mas nunca chega a 52 porque o limite global corta antes.

2. **Slice artificial** (linha 167): `catDeals.slice(0, 4)` limita categorias com menos de 6 deals, mas para categorias maiores o filteredDeals retorna tudo — porém "tudo" já veio limitado pelo `.limit(50)`.

### Correções

**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

1. **Remover `.limit(50)`** da query de deals (linha 135) — ou aumentar para 500. O filtro por `brand_id + is_active` já delimita o volume. Com 50 como teto, categorias grandes ficam cortadas.

2. **Quando uma categoria é selecionada, mostrar TODAS as ofertas** no grid vertical sem slice. A regra do slice de 4 cards (linha 167) só faz sentido na view "Todos" agrupada. Quando o usuário selecionou uma categoria específica, ele quer ver tudo com scroll vertical natural.

3. **Garantir que o grid não tenha restrição de altura** — já está ok no código atual (`grid grid-cols-2 gap-3`), mas vou confirmar que nenhum container pai limita.

### Resultado esperado

Ao selecionar "Casa" com 52 ofertas, o grid mostrará todos os 52 cards em 2 colunas (26 linhas), com scroll vertical natural da página.

