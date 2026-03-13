

## Revisao Completa: Cores no Modo Escuro

### Problemas Identificados

Analisando as 3 screenshots, os seguintes elementos ainda usam a cor primaria da marca (verde/vermelho) em vez de branco ou dourado no modo escuro:

#### 1. Offer Detail (tipo STORE) — `CustomerOfferDetailPage.tsx`

| Linha | Elemento | Cor Atual | Correcao |
|-------|----------|-----------|----------|
| 583 | Nome da loja no card | `primary` | `accentOrWhite` (branco em dark) |
| 584 | Chevron ao lado da loja | `primary` | `accentOrWhite` |
| 594 | Borda tracejada do "Vale Resgate" | `${primary}30` | Branca com opacidade em dark |
| 613 | "33% de desconto aplicado" texto | `primary` | Branco em dark |
| 613 | Background do badge de desconto | `${primary}12` | Semi-transparente branco em dark |

#### 2. Store Detail — `CustomerStoreDetailPage.tsx`

| Linha | Elemento | Cor Atual | Correcao |
|-------|----------|-----------|----------|
| 160 | Seta de voltar | `fg` | `text-foreground` (ja deveria funcionar, mas vou verificar) |
| 548 | Preco "R$ 50,00" na lista de ofertas | `primary` | Dourado (`--vb-highlight`) em dark |

### Alteracoes Planejadas

**`CustomerOfferDetailPage.tsx`:**
- Linha 583-584: Trocar `style={{ color: primary }}` por `style={{ color: accentOrWhite }}` no nome e chevron da loja dentro do card STORE
- Linha 594: Borda tracejada — usar `isDark ? "hsl(var(--foreground) / 0.2)" : \`${primary}30\``
- Linha 613: Texto e bg do badge de desconto — usar `isDark ? "hsl(var(--foreground))" : primary` para cor e bg semi-transparente adequado

**`CustomerStoreDetailPage.tsx`:**
- Linha 548: Preco na lista de ofertas — usar `isDark ? "hsl(var(--vb-highlight))" : primary`
- Linha 160: Back arrow — trocar de `style={{ color: fg }}` para `className="text-foreground"` para consistencia

