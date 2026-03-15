

## Análise: O que foi implementado vs. o que está visível

### Status da implementação

Todos os componentes solicitados **foram criados e integrados corretamente**:

1. **FontSelect** (`src/components/brand-theme/FontSelect.tsx`) — Seletor com 30+ fontes Google organizadas por categoria (Sans-serif, Serif, Display, Monospace), com preview inline de cada fonte.

2. **LayoutDimensionsSection** (`src/components/brand-theme/LayoutDimensionsSection.tsx`) — 7 sliders de personalização:
   - Border-radius dos cards (0-32px)
   - Altura da imagem dos cards (80-240px)
   - Tamanho do ícone de categoria (40-80px)
   - Raio do ícone de categoria (4-50px)
   - Tamanho da fonte de categoria (8-16px)
   - Raio dos botões (0-24px)
   - Tamanho do título de seção (12-24px)

3. **BrandThemePreview** — O preview do celular na sidebar lê todos os valores de layout (cardRadius, iconSize, iconRadius, catFontSize, btnRadius, sectionTitleSize) e os aplica em tempo real.

4. **useBrandTheme** — Injeta variáveis CSS (`--brand-card-radius`, `--brand-icon-size`, etc.) no DOM.

5. **SegmentNavSection** — Lê os valores de layout do tema da marca.

### Por que você não está vendo

Você está na página `/index` (landing page). O editor de personalização está disponível em **duas rotas**:
- **Página de edição da marca** (`BrandForm.tsx`) — aba "Tema"
- **Página de tema da plataforma** (`PlatformThemePage.tsx`)

### Próximo passo

Não há código a corrigir — tudo está implementado. Para visualizar, navegue até a página de edição de uma marca (ex: Ubiz Resgata) e acesse a aba de **Tema/Personalização**. Lá verá os seletores de fonte, sliders de layout e o preview ao vivo.

Se houver algo específico que está faltando ou diferente do esperado quando acessar o editor, me avise para ajustar.

