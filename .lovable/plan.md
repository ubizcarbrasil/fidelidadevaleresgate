

## Plano: Revisão e Otimização do DriverMarketplace

### Problemas identificados

1. **`DriverDealCardGrid` usa `motion.div` com animação staggered** — cada card importa framer-motion e calcula delay por índice. Em listas grandes isso é pesado e causa jank no scroll
2. **`LucideIcon` recalcula o ícone a cada render** — faz split/map/join toda vez sem memoização
3. **Overlay "Ver todos" carrega framer-motion `AnimatePresence` mesmo quando fechado** — peso desnecessário no bundle inicial
4. **`DriverDealCard` não tem `React.memo`** — re-renderiza em qualquer mudança de estado do pai (busca, categoria selecionada)
5. **Cálculos repetidos** dentro do `.map()` de categorias (itemsPerRow recalculado a cada row)

### Alterações

**`src/components/driver/DriverDealCardGrid.tsx`**
- Remover `motion.div` — substituir por `div` com CSS `animation` (fadeIn via classe Tailwind `animate-in fade-in`)
- Remover import de `framer-motion`
- Usar `active:scale-[0.97] transition-transform` igual ao `DriverDealCard`
- Envolver com `React.memo`

**`src/components/driver/DriverDealCard.tsx`**
- Envolver com `React.memo` para evitar re-renders desnecessários

**`src/components/driver/DriverMarketplace.tsx`**
- Memoizar `LucideIcon` com `React.memo`
- Memoizar `categories`, `activeBanners`, `dealsByCategory` com `useMemo`
- Extrair cálculo de `itemsPerRow` para fora do loop de rows
- Manter `AnimatePresence` apenas no overlay (já está correto, sem mudança necessária)

**`src/components/driver/DriverCategoryCarousel.tsx`**
- Envolver com `React.memo`

### Resultado esperado
- Scroll mais fluido nos carrosseis
- Menos re-renders ao digitar na busca ou selecionar categoria
- Bundle levemente menor (remove framer-motion do card grid)
- Mesmo visual e comportamento funcional

### Arquivos
- `src/components/driver/DriverDealCardGrid.tsx`
- `src/components/driver/DriverDealCard.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/DriverCategoryCarousel.tsx`

