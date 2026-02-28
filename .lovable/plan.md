

## Plan: Redesign Completo da Home do Cliente (Inspirado no Meliuz)

### 1. Fix critico: erro de hooks no `/customer-preview`

**Arquivo**: `src/App.tsx` (linha 145)
- Substituir `if (loading) return null` por um spinner inline para manter hook count estavel

### 2. DB Migration: adicionar colunas de personalização em `brand_sections`

Adicionar a `brand_sections`:
- `banner_image_url text` -- banner de identificação da seção
- `banner_height text DEFAULT 'medium'` -- small/medium/large
- `display_mode text DEFAULT 'carousel'` -- carousel/grid/list

### 3. Novo template type: `STORES_HIGHLIGHT` (lista horizontal com cashback/badges)

Inspirado nas screenshots (Lojas em destaque com logo, nome, "Até X% cashback", badges "ÚLTIMAS HORAS" / "IMPERDÍVEL"), esse layout aparece em varias seções do Meliuz. Usar o campo `visual_json` existente para configurar badges e textos de destaque por item.

### 4. Redesign `HomeSectionsRenderer.tsx`

Refatorar completamente os componentes de seção:

- **Separadores claros entre seções**: linha fina + padding generoso (já existe parcialmente, melhorar)
- **Header de seção**: titulo bold à esquerda + "Abrir todas" em cor primary à direita (como Meliuz)
- **Banner dentro da seção**: renderizar `banner_image_url` como banner arredondado (18-28px) acima dos items
- **Carrossel de lojas estilo grid 4x2**: logo arredondado + nome truncado + "Até X%" bold + "Era X%" cinza (como nas screenshots)
- **Lista horizontal de lojas com badges**: logo + nome + cashback + badges coloridos
- **Cupons estilo ticket**: cards rosa com logo + "CUPOM X% OFF" + botão "PEGAR CUPOM" (como na screenshot IMG_3270)
- **"Mostrar mais" / "Abrir todas"**: CTA que abre overlay fullscreen com lista + busca

### 5. Nova página `SectionDetailOverlay.tsx`

Quando clicar "Abrir todas":
- Header com titulo + voltar
- Banner de identificação (se configurado)
- Barra de busca
- Lista vertical de items (logo + nome + cashback + badges) como na screenshot IMG_3264
- Integrado ao `CustomerNavContext`

### 6. Melhorar `BrandSectionsManager.tsx` (admin)

Adicionar campos no dialog de criação/edição:
- Upload de banner image da seção
- Seletor de altura do banner (small/medium/large)
- Seletor de modo de exibição

### 7. Visual polish

- Shimmer animation nos Skeletons (`src/index.css`)
- Migrar fetching do `HomeSectionsRenderer` para `useQuery`
- Framer Motion staggered entry nos cards

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `src/App.tsx` | Fix hook (linha 145) |
| DB migration | Colunas banner em brand_sections |
| `src/components/HomeSectionsRenderer.tsx` | Redesign completo com novos layouts |
| `src/components/customer/SectionDetailOverlay.tsx` | **Novo** |
| `src/components/customer/CustomerLayout.tsx` | Registrar SectionDetailOverlay no nav |
| `src/components/BrandSectionsManager.tsx` | Campos de banner/display mode |
| `src/index.css` | Shimmer keyframes |

### Ordem de implementação

1. Fix hooks `App.tsx`
2. DB migration
3. Redesign HomeSectionsRenderer (novos layouts de seção)
4. SectionDetailOverlay
5. Integrar no CustomerLayout
6. Admin: campos de banner no BrandSectionsManager
7. Shimmer + polish

