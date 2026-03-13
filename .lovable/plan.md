

## Plano: Compactar espaçamentos da home do cliente

### Problema
Há espaços excessivos entre as seções (banner, categorias, "Selecionados para você", etc.), visíveis na screenshot com a área vermelha marcada.

### Fontes do espaço extra

1. **`CustomerHomePage.tsx`** — `space-y-3` no container principal + cada `motion.div` wrapper adiciona margem
2. **`HomeSectionsRenderer.tsx`** — dividers entre seções com `py-2` (linha 161) + `mb-3` nos headers (linha 342) + `mb-3` nos banners (linha 363)
3. **`ForYouSection.tsx`** — `mb-3` no header (linha 69)
4. **`SegmentNavSection.tsx`** — `mb-3` no header (linha 167)

### Alterações

**1. `src/pages/customer/CustomerHomePage.tsx`**
- Reduzir `space-y-3` → `space-y-1` no container principal
- Remover paddings extras (`pt-2` no greeting)

**2. `src/components/HomeSectionsRenderer.tsx`**
- Reduzir dividers de `py-2` → `py-0.5`
- Reduzir `mb-3` → `mb-1.5` nos section headers e banners
- Reduzir skeletons gap de `space-y-6` → `space-y-2`

**3. `src/components/customer/ForYouSection.tsx`**
- Reduzir `mb-3` → `mb-1.5` no header

**4. `src/components/customer/SegmentNavSection.tsx`**
- Reduzir `mb-3` → `mb-1.5` no header e skeleton

Resultado: seções ficam visualmente coladas com separação mínima, eliminando os espaços grandes entre banner e conteúdo.

