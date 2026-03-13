

## Diagnostico: Tamanho dos Cards e Linhas no Construtor de Sessoes

### Problema 1: Tamanho dos cards (icon_size) nao e aplicado
O wizard salva `icon_size` ("small"=48px, "medium"=64px, "large"=80px) no banco, mas os componentes de renderizacao em `HomeSectionsRenderer.tsx` **ignoram completamente** esse valor. Os cards de ofertas e lojas usam tamanhos fixos hardcoded:
- `OffersCarousel`: `min-w-[170px] max-w-[190px]` com imagem `h-32`
- `StoresGrid`: `min-w-[160px] max-w-[180px]` com imagem `h-28`
- `OffersGrid`: tambem hardcoded

### Problema 2: Linhas (rows_count) nao e respeitado
O `rows_count` e salvo no banco mas nunca lido pelos componentes de renderizacao. Todos os carrosseis e grids renderizam em uma unica linha horizontal (`flex overflow-x-auto`), ignorando a configuracao de 2+ linhas.

### Plano de Correcao

**Arquivo: `src/components/HomeSectionsRenderer.tsx`**

1. **Passar `icon_size` e `rows_count` para os sub-componentes** (OffersCarousel, OffersGrid, StoresGrid, HighlightsWeekly):
   - Extrair `icon_size` do section (ja temos `columnsCount` e `rowsCount`)
   - Passar como props para cada componente renderizado

2. **Aplicar `icon_size` nos tamanhos dos cards**:
   - Mapear: small → `min-w-[140px] h-24`, medium → `min-w-[170px] h-32`, large → `min-w-[200px] h-40`
   - Aplicar nas dimensoes de imagem e card nos componentes OffersCarousel, StoresGrid, etc.

3. **Aplicar `rows_count` nos carrosseis e grids**:
   - Quando `rows_count > 1` em um carrossel: usar CSS grid com `grid-template-rows: repeat(N, 1fr)` + `grid-auto-flow: column` + overflow horizontal, criando um carrossel multi-linha
   - Quando `rows_count > 1` em um grid: limitar itens a `columns * rows`

4. **Corrigir tambem `R$` remanescente** na linha 670 do OffersGrid que ainda mostra `R$` em vez de `pts`.

### Mapeamento de Tamanhos

```text
icon_size  | Card Width     | Image Height | Label
-----------|----------------|--------------|------
small      | 140-160px      | 96px (h-24)  | P
medium     | 170-190px      | 128px (h-32) | M (atual)
large      | 200-220px      | 160px (h-40) | G
```

### Escopo
- Apenas `HomeSectionsRenderer.tsx` precisa ser alterado
- Sem mudancas no banco ou wizard (ja salva corretamente)
- Afeta todas as marcas/empreendedores igualmente pois compartilham o mesmo motor de renderizacao

