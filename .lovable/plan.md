

## Diagnóstico: Por que as sessões "Por Categoria" não aparecem no app

### Problema raiz (2 bugs)

**Bug 1 — Sem `brand_section_sources`**: O wizard cria a `brand_section` mas **não insere nenhuma linha em `brand_section_sources`**. No renderer (`HomeSectionsRenderer`), a linha 232 faz `if (!source) return;` — então a sessão é criada mas nunca carrega dados.

**Bug 2 — Filtro em tabela relacionada inválido**: Para ofertas, o filtro `query.in("stores.taxonomy_segment_id", segmentFilterIds)` não funciona corretamente com PostgREST. Filtros em tabelas relacionadas precisam de sintaxe diferente ou filtragem client-side.

### Correções

**1. `SectionCreatorWizard.tsx` — Inserir `brand_section_sources` após criar a sessão**
- Após o insert de `brand_sections`, fazer um segundo insert em `brand_section_sources` com:
  - `source_type`: `"STORES"` (para `grid_stores`) ou `"OFFERS"` (para `carousel_offers`/`grid_offers`)
  - `limit`: valor de `maxItems`
- Usar o ID da seção recém-criada (alterar insert para `.insert(...).select("id").single()`)

**2. `HomeSectionsRenderer.tsx` — Corrigir lógica de fetch para seções com `segment_filter_ids`**
- Antes do check `if (!source)`, adicionar branch: se `segmentFilterIds.length > 0`, determinar automaticamente o source_type baseado no `templateType` (STORES ou OFFERS) e executar o fetch com os filtros de segmento
- Para ofertas com filtro de segmento: buscar ofertas normalmente, depois filtrar client-side por `stores.taxonomy_segment_id` (já que o `.in()` em foreign table não funciona)
- Alternativa melhor: buscar stores primeiro pelos segmentos, depois filtrar ofertas por `store_id`

**3. `HomeSectionsRenderer.tsx` — Filtro de ofertas por segmento corrigido**
- Substituir `query.in("stores.taxonomy_segment_id", segmentFilterIds)` por filtragem em duas etapas:
  1. Buscar IDs de stores com `taxonomy_segment_id` nos segmentos selecionados
  2. Filtrar ofertas com `.in("store_id", storeIds)`

### Arquivos afetados
- `src/components/page-builder-v2/SectionCreatorWizard.tsx`
- `src/components/HomeSectionsRenderer.tsx`

