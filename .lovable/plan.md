

## Plano: Adicionar tipo de sessão "Destaques da Semana" ao wizard

### O que é
Um novo tipo de conteúdo no `SectionCreatorWizard` chamado **"Destaques da Semana"** que exibe ofertas/parceiros selecionados com layout diferenciado (cards maiores com destaque visual).

### Alterações

**1. Migração — novo template na tabela `section_templates`**
- Inserir registro com `key: 'highlights_weekly'`, `type: 'HIGHLIGHTS_WEEKLY'`, `name: 'Destaques da Semana'`

**2. `src/components/page-builder-v2/SectionCreatorWizard.tsx`**
- Adicionar entrada `highlights` ao array `CONTENT_TYPES` com ícone `Star`, label "Destaques da Semana", description "Seleção especial com destaque visual", templateKeys `["highlights_weekly"]`
- Adicionar `LAYOUT_OPTIONS.highlights` com 2 opções: `carousel` (carrossel com cards grandes) e `grid` (grade em destaque)
- Atualizar `resolveTemplateKey` com mapeamento `highlights: { carousel: "highlights_weekly", grid: "highlights_weekly" }`
- Adicionar filtro de ordenação `featured` ("Destaques") ao `FILTER_MODES`

**3. `src/components/page-builder/types.ts`**
- Adicionar `{ value: "HIGHLIGHTS_WEEKLY", label: "Destaques da Semana" }` ao array `SECTION_TYPES`

**4. `src/components/HomeSectionsRenderer.tsx`** (se necessário)
- Garantir que o renderer trata o novo tipo renderizando como carrossel/grid de ofertas com estilo diferenciado (cards maiores, badge "Destaque")

**5. `src/components/BrandSectionsManager.tsx`**
- Adicionar `HIGHLIGHTS_WEEKLY: "Destaques da Semana"` ao `TEMPLATE_TYPE_LABELS`

### Resultado
O wizard ganha uma 7ª opção de conteúdo "Destaques da Semana" com layouts carousel/grid, permitindo ao operador criar vitrines de destaque com visual diferenciado.

