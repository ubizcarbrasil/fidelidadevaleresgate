

## Plano: Corrigir contraste de cores no modo escuro e claro do app do cliente

### Problema identificado

Diversas páginas do app do cliente usam **cores hardcoded** que só funcionam no modo claro:

1. **`#F2F2F7`** (cinza claro iOS) — usado em search bars, filtros e skeletons na `CustomerRedemptionsPage` e `CustomerAuthPage`. No dark mode fica como bloco branco sem contraste.

2. **`bg-white`** — usado diretamente em:
   - `CustomerWalletPage` (cards de histórico de pontos, skeletons)
   - `CustomerStoreDetailPage` (cards de ofertas, FAQ, tabs)
   - `CustomerAuthPage` (container do form)

3. **`hover:bg-black/[0.02]`** e **`rgba(0,0,0,...)`** para sombras — invisíveis ou feios no dark mode.

4. **Texto com opacidade hex** (ex: `${fg}50`, `${fg}80`) — funciona visualmente mas `${fg}` resolve para `hsl(...)`, e concatenar hex alpha em `hsl(...)50` não é CSS válido. Isso pode causar cores invisíveis em ambos os modos.

### Correções planejadas

**Arquivos a alterar:**

| Arquivo | Mudança |
|---|---|
| `CustomerRedemptionsPage.tsx` | `#F2F2F7` → `hsl(var(--muted))` via classe `bg-muted` |
| `CustomerWalletPage.tsx` | `bg-white` → `bg-card` nos cards de histórico e skeletons |
| `CustomerAuthPage.tsx` | `bg-white` → `bg-card`, `#F2F2F7` → `bg-muted` nos inputs |
| `CustomerStoreDetailPage.tsx` | `bg-white` → `bg-card` nos cards, tabs, FAQ |
| `CustomerProfilePage.tsx` | `hover:bg-black/[0.02]` → `hover:bg-muted/50` |
| `CustomerLayout.tsx` | Verificar header e tab bar para contraste dark |

### Abordagem

- Substituir todas as cores hardcoded por **variáveis semânticas do Tailwind** (`bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`)
- Para inline styles que precisam de alpha, usar `hsla()` com parsing correto em vez de concatenação hex inválida
- Manter a identidade visual vibrante (gradientes da marca no hero card) que já funcionam bem em ambos os modos

### Resultado esperado

O app do cliente terá contraste correto tanto no modo claro quanto no escuro, sem blocos brancos em fundo escuro nem textos invisíveis.

