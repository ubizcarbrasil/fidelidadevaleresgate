

## 4 Correções no Achadinhos

### 1. Limitar a 1 linha quando categoria tem menos de 6 ofertas
**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

A regra já existe na linha 167 (`catDeals.slice(0, 3)`), mas ela está cortando ofertas mesmo no grid. O problema é que com 4-5 ofertas no grid de 2 colunas, fica estranho mostrar só 3. Ajuste: quando categoria selecionada tem < 6 deals, mostrar no máximo 1 linha = **no grid de 2 colunas, limitar a 2 cards** (para não ficar ímpar). Se tem 3-5, mostrar até 4 (2x2). Se tem 1-2, mostrar o que tem.

Regra simplificada: `catDeals.length < 6 ? catDeals.slice(0, 4) : catDeals` — limita a 2 linhas no grid (4 cards máx).

### 2. Permitir scroll vertical quando categoria selecionada
**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

O grid já existe (linha 306), mas o problema é que ele está sendo limitado pelo slice acima. Quando a categoria tem 6+ ofertas, precisa permitir scroll vertical mostrando TODOS os cards no grid, não apenas os primeiros. A solução:
- Remover o slice para categorias com 6+ ofertas (já está assim)
- Para o grid, não limitar altura — o scroll natural da página cuida disso
- Adicionar botão "Ver todos" no final do grid como opcional (abre a `AchadinhoCategoryPage` completa)

### 3. Melhorar categorização automática
**Arquivo**: `supabase/functions/mirror-sync/index.ts`

O matching por keywords está impreciso. Melhorias:
- Aumentar `MIN_SCORE` de 3 para 4 para evitar matches fracos
- Adicionar bônus de peso quando o campo `category` da API (que vem do Divulgador Inteligente) faz match direto com o nome da categoria — isso é o sinal mais forte
- Fazer matching case-insensitive no campo `category` do produto contra os nomes das categorias como primeiro critério (ex: produto com `category: "Eletrônicos"` deve ir direto para a categoria "Eletrônicos")

### 4. Ordem das categorias deve respeitar o `order_index` do painel
**Arquivo**: `src/components/customer/AchadinhoSection.tsx`

As categorias já são buscadas com `.order("order_index")` (linha 145), então a ordem do banco é respeitada. Porém, o filtro `allCats.filter(c => catIdsWithDeals.has(c.id))` na linha 155 mantém a ordem original. Isso já está correto — mas os deals dentro de cada categoria não respeitam nenhuma ordem específica. Garantir que o `order_index` dos deals também seja usado (já está na query, linha 134).

O problema real pode ser que no painel admin as categorias foram reordenadas mas o `order_index` não foi atualizado no banco. Verificar se o painel salva `order_index` corretamente.

**3 arquivos alterados**:
1. `src/components/customer/AchadinhoSection.tsx` — ajuste no slice + scroll vertical livre
2. `supabase/functions/mirror-sync/index.ts` — melhorar matching com category name direto + MIN_SCORE 4

