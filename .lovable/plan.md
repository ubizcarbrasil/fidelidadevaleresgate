

## Plano: Unificar Construtor de Páginas (V1 + V2)

O objetivo é criar um único **Construtor de Páginas** que combine os elementos visuais livres do V1 (texto, botão, banner, ícone, divisor, espaçador) com as sessões dinâmicas do V2 (ofertas, parceiros, cupons, links manuais), incluindo drag-and-drop real e preview em tempo real.

---

### O que será feito

1. **Unificar em uma única rota `/page-builder`**
   - Remover a rota `/page-builder-v2` e o link no sidebar
   - O `PageBuilderPage` será o ponto único de entrada
   - Renomear no sidebar para "Construtor de Páginas"

2. **Refatorar o editor para suportar dois tipos de blocos**
   - **Blocos estáticos** (V1): texto, botão, banner, ícone, divisor, espaçador — salvos em `elements_json`
   - **Blocos dinâmicos** (V2): sessões de ofertas, parceiros, cupons, links manuais — salvos em `brand_sections` vinculadas à página
   - Ambos os tipos aparecem em uma **lista única ordenável** no editor

3. **Drag-and-drop real com reordenação unificada**
   - Lista de blocos à esquerda com drag handles
   - Reordenação por arrastar entre blocos estáticos e dinâmicos
   - Cada item mostra tipo + nome/conteúdo resumido

4. **Preview em tempo real lado a lado**
   - Painel direito (ou split view) mostrando a página renderizada como ficará no app do cliente
   - Atualização instantânea ao editar propriedades
   - Renderiza tanto os elementos estáticos (V1 `ElementRenderer`) quanto as sessões dinâmicas (V2 `PageSectionBlock`)

5. **Painel de propriedades contextual**
   - Ao selecionar um bloco estático: mostra controles de tipografia, cores, sombra, ação
   - Ao selecionar um bloco dinâmico: mostra controles de layout (carousel/grid), filtros, limites, CTA
   - Para sessões de links manuais: botão para abrir o editor de links

6. **Filtros e configurações de página**
   - Manter os controles existentes: busca habilitada, visibilidade, subtítulo
   - Adicionar campo para ordenação global dos blocos

---

### Arquivos a serem modificados/criados

- **`src/pages/PageBuilderPage.tsx`** — Refatorar para ser o editor unificado
- **`src/pages/PageBuilderV2Page.tsx`** — Remover (código será absorvido)
- **`src/components/page-builder/UnifiedEditor.tsx`** — Novo componente principal do editor com lista de blocos, drag-and-drop e split preview
- **`src/components/page-builder/types.ts`** — Estender com tipo `UnifiedBlock` que pode ser estático ou dinâmico
- **`src/components/page-builder/UnifiedPreview.tsx`** — Preview que renderiza ambos os tipos de bloco
- **`src/components/page-builder-v2/PageSectionsEditor.tsx`** — Mover lógica de sessões para dentro do editor unificado
- **`src/components/page-builder-v2/SectionEditor.tsx`** — Manter como sub-editor de propriedades de sessão
- **`src/components/page-builder-v2/ManualLinksEditor.tsx`** — Manter como sub-editor de links
- **`src/App.tsx`** — Remover rota `/page-builder-v2`
- **`src/components/consoles/RootSidebar.tsx`** — Remover item "Construtor de Páginas V2"
- **`src/components/consoles/BrandSidebar.tsx`** — Remover item V2

---

### Detalhes técnicos

- A lista unificada de blocos usará um array misto: `{ type: "static", element: PageElement } | { type: "dynamic", sectionId: string, section: SectionRow }`, ordenado por `order_index`
- O drag-and-drop usará HTML5 drag API nativa (já implementada no V1)
- Os blocos estáticos continuam salvos em `elements_json` da `custom_pages`
- Os blocos dinâmicos continuam salvos em `brand_sections` com `page_id`
- O `order_index` será compartilhado entre ambos os tipos para manter a ordem global
- O preview usará `ElementRenderer` para estáticos e `PageSectionBlock` (extraído do `PageRenderer`) para dinâmicos

