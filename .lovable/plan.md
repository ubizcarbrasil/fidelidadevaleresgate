

## Plano: Personalização avançada de marca com preview ao vivo

### Problema atual
O editor de tema (`BrandThemeEditor`) tem opções limitadas: cores, 2 campos de fonte com texto livre (sem lista), e imagens. Faltam controles para tamanhos de cards, ícones, border-radius, e a seleção de fontes é confusa (o usuário precisa saber o nome exato da fonte Google).

### Alterações

#### 1. Expandir a interface `BrandTheme` (`src/hooks/useBrandTheme.ts`)
Adicionar novas propriedades ao tipo:
```
layout?: {
  card_border_radius?: number;     // px (ex: 8, 12, 16, 24)
  card_image_height?: number;      // px (ex: 120, 160, 200)
  category_icon_size?: number;     // px (ex: 48, 56, 64, 72)
  category_icon_radius?: number;   // px
  category_font_size?: number;     // px (ex: 9, 10, 11, 12)
  button_radius?: number;          // px
  section_title_size?: number;     // px
}
```
E aplicar essas variáveis CSS no hook `useBrandTheme` (ex: `--brand-card-radius`, `--brand-icon-size`).

#### 2. Adicionar seletor de fontes com lista (`BrandThemeEditor.tsx`)
Substituir os inputs de texto livre por um `Select` (combobox) com as **30 fontes Google mais populares** organizadas por categoria:
- **Sans-serif:** Inter, Poppins, Montserrat, Open Sans, Roboto, Lato, Nunito, Raleway, Work Sans, DM Sans, Plus Jakarta Sans, Outfit
- **Serif:** Playfair Display, Merriweather, Lora, PT Serif, Crimson Text, Libre Baskerville
- **Display:** Bebas Neue, Oswald, Anton, Righteous, Pacifico
- **Monospace:** JetBrains Mono, Fira Code, Space Mono

Cada opção mostra o nome da fonte renderizado na própria fonte (preview inline).

#### 3. Nova seção "Layout e Dimensões" no editor
Adicionar uma nova `Card` no `BrandThemeEditor` com controles visuais:
- **Border-radius dos cards** — Slider (0-32px) com preview
- **Altura da imagem dos cards** — Slider (100-240px)
- **Tamanho do ícone de categoria** — Slider (40-80px)
- **Raio do ícone de categoria** — Slider (8-50px, ou "circular")
- **Raio dos botões** — Slider (0-24px)
- **Tamanho do título de seção** — Slider (12-20px)

Cada slider mostra o valor atual em pixels e atualiza o preview em tempo real.

#### 4. Atualizar o `BrandThemePreview` para refletir as novas props
O preview do celular na sidebar já existe — precisa ler os novos valores de `layout` e aplicá-los nos cards, ícones e botões renderizados dentro do preview.

#### 5. Aplicar variáveis CSS no app do cliente
No hook `useBrandTheme`, as novas props de layout são convertidas em variáveis CSS que os componentes do app do cliente já podem consumir (ex: `SegmentNavSection` lê `--brand-icon-size` ao invés de valor fixo).

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/hooks/useBrandTheme.ts` | Expandir interface `BrandTheme` com `layout`, aplicar CSS vars |
| `src/components/BrandThemeEditor.tsx` | Adicionar seção "Layout", trocar inputs de fonte por Select com lista |
| `src/components/BrandThemePreview.tsx` | Ler `theme.layout` e aplicar nos elementos do preview |
| `src/components/customer/SegmentNavSection.tsx` | Ler CSS vars `--brand-icon-size` / `--brand-icon-radius` como fallback |

