

## Plano: Scroll por coluna (linha inteira) no carrossel multi-linha

### Problema
Hoje o grid horizontal com `gridAutoColumns: "minmax(160px, 180px)"` permite scroll livre pixel a pixel. O usuário quer que o scroll "encaixe" por coluna — ou seja, cada swipe avança uma coluna inteira (que contém N linhas de cards).

### Solução

**`src/components/driver/DriverMarketplace.tsx` (linhas 356-364)**

Adicionar `scrollSnapAlign: "start"` em cada card do grid para que o snap aconteça por coluna:

1. No container grid, manter `scrollSnapType: "x mandatory"` (já existe)
2. Trocar `gridAutoColumns` para um valor fixo (`170px`) para consistência
3. Envolver cada coluna de cards com snap — como o `gridAutoFlow: column` já agrupa por coluna, basta adicionar `scroll-snap-align: start` nos itens do grid

Na prática, passar uma prop ou style inline no `DriverDealCardGrid` para incluir `scrollSnapAlign: "start"` no wrapper do card.

**`src/components/driver/DriverDealCardGrid.tsx`**
- Adicionar `style={{ scrollSnapAlign: "start", ...existingStyle }}` no `<motion.div>` raiz

### Arquivos
- `src/components/driver/DriverMarketplace.tsx` — fixar `gridAutoColumns: "170px"`
- `src/components/driver/DriverDealCardGrid.tsx` — adicionar `scrollSnapAlign: "start"`

