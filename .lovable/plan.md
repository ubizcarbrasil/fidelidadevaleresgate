

## Plano: Sessões filtradas por Categoria/Segmento

### Problema
Não existe forma de criar sessões filtradas por categorias de segmento (ex: "Alimentação", "Beleza"). O wizard atual não tem seletor de categorias/segmentos.

### Alterações

**1. Migração — nova coluna na tabela `brand_sections`**
- Adicionar coluna `segment_filter_ids uuid[]` (array de IDs de `taxonomy_segments`) à tabela `brand_sections`, nullable, default null
- Quando preenchida, a sessão exibe apenas lojas/ofertas cujas stores pertencem aos segmentos listados

**2. Novo tipo de conteúdo no Wizard: "Por Categoria"**
- Em `SectionCreatorWizard.tsx`, adicionar tipo `by_category` com ícone `LayoutGrid` e label "Por Categoria / Segmento"
- Layouts: carousel e grid (reutiliza templates `stores_grid` e `offers_carousel`)
- No Step 4 (Detalhes), quando `contentType === "by_category"`:
  - Buscar `taxonomy_categories` + `taxonomy_segments` do banco
  - Exibir seletor agrupado por categoria com checkboxes para cada segmento
  - O título da sessão auto-preenche com o nome da categoria selecionada (editável)
  - Permite selecionar múltiplos segmentos de uma ou mais categorias

**3. Atualizar `handleCreate` no Wizard**
- Incluir `segment_filter_ids` no insert de `brand_sections` quando categorias forem selecionadas
- O template_key será `stores_grid` ou `offers_carousel` dependendo do sub-tipo escolhido (lojas ou ofertas)

**4. Atualizar renderização em `HomeSectionsRenderer.tsx`**
- No `SectionBlock`, ler `segment_filter_ids` da seção
- Quando presente, adicionar filtro `.in("taxonomy_segment_id", segmentIds)` nas queries de stores e `.in("store_taxonomy_segment_id", segmentIds)` (ou via join) nas queries de offers

**5. Atualizar `SectionEditor` / `BrandSectionsManager`**
- Exibir os segmentos filtrados como badges no editor de seções existente

### Fluxo do usuário
1. Wizard → escolhe "Por Categoria"
2. Escolhe se quer exibir **Lojas** ou **Ofertas** daquela categoria
3. Seleciona layout (carousel/grid)
4. Configura aparência
5. No passo Detalhes: seleciona categorias/segmentos com checkboxes, edita título
6. Salva → sessão aparece na home filtrando pelo segmento

### Arquivos afetados
- `supabase/migrations/` — nova coluna `segment_filter_ids`
- `src/components/page-builder-v2/SectionCreatorWizard.tsx` — novo tipo + seletor de segmentos
- `src/components/HomeSectionsRenderer.tsx` — filtro por segmento nas queries
- `src/components/BrandSectionsManager.tsx` — label do novo tipo

