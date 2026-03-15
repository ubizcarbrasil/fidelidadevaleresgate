

## Plano: Corrigir modo escuro do app cliente + atualizar preview admin

### Diagnóstico raiz

A marca "Urbano Norte" tem `foreground: "0 100% 0%"` (preto) e `secondary: "120 100% 18%"` (verde escuro) nas cores do modo claro. O guard do `hslToCss` só protege quando o fallback começa com `"hsl(var(--"` — mas o `secondary` usa fallback `""`, então o guard não dispara, resultando em texto preto/verde escuro no dark mode.

Além disso, `BranchPickerSheet.tsx` usa `hsl(${theme.colors.primary})` diretamente, sem nenhum guard.

### Estratégia: Fixar Design System no dark mode

Criar uma função centralizada que, **quando em dark mode**, **ignora cores da marca** para tokens estruturais e retorna sempre os tokens CSS do Design System.

### Mudanças

**1. `src/lib/utils.ts` — Reescrever `hslToCss`**

A função precisa ignorar o valor da marca quando em dark mode, independentemente do fallback:

```typescript
export function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  const isDark = typeof document !== "undefined" 
    && document.documentElement.classList.contains("dark");
  // In dark mode, always use CSS variable fallbacks (Design System tokens)
  if (isDark && fallback) return fallback;
  return `hsl(${hsl})`;
}
```

Isso garante que em dark mode, `primary`, `secondary`, `foreground`, `fg` sempre resolvam para os tokens CSS globais (`--primary`, `--foreground`, etc.), que já têm contraste adequado.

**2. Remover cópias locais de `hslToCss` em ~10 arquivos**

Todos os arquivos que redefinem `hslToCss` localmente precisam importar de `@/lib/utils`:
- `src/pages/customer/CustomerOffersPage.tsx`
- `src/pages/customer/CustomerOfferDetailPage.tsx`
- `src/pages/customer/CustomerAuthPage.tsx`
- `src/pages/customer/CustomerProfilePage.tsx`
- `src/pages/customer/CustomerWalletPage.tsx`
- `src/pages/customer/CustomerRedemptionsPage.tsx`
- `src/pages/customer/CustomerRedemptionDetailPage.tsx`
- `src/pages/customer/CustomerStoreDetailPage.tsx`
- `src/pages/customer/CustomerEmissorasPage.tsx`
- `src/components/customer/CustomerSearchOverlay.tsx`
- `src/components/customer/NotificationDrawer.tsx`
- `src/components/customer/CustomerLedgerOverlay.tsx`

**3. `src/components/customer/BranchPickerSheet.tsx` — Usar tokens CSS**

Trocar `hsl(${theme.colors.primary})` por `hsl(var(--primary))` e `hsl(${theme.colors.foreground})` por `hsl(var(--foreground))` para respeitar o dark mode.

**4. `src/components/customer/OfferPurposeBadge.tsx` — Adaptar ao dark**

As cores hardcoded (ex: `hsl(142 71% 35%)`) ficam escuras demais no dark. Trocar para usar tokens CSS:
- EARN: `bg-success/15` + `text-success`
- REDEEM: `bg-warning/15` + `text-warning`

**5. `src/components/customer/RedemptionCard.tsx` — Status badges**

Cores hardcoded (`#FEF3C7`, `#92400E`, etc.) não adaptam ao dark. Trocar por tokens semânticos.

**6. `src/pages/customer/CustomerOfferDetailPage.tsx` — Elementos hardcoded**

- `bg-amber-50 dark:bg-amber-950/30` (linha ~415) → usar tokens `--warning`
- `#FFD54F` / `#3E2723` / `#E65100` → usar `hsl(var(--vb-gold))` e `hsl(var(--vb-gold-foreground))`
- Botão "PAGUE X% COM PONTOS" (linha ~765): usar `--vb-gold` + `--vb-gold-foreground`

**7. `src/components/BrandThemePreview.tsx` — Atualizar para layout atual**

Atualizar o preview mock para refletir o layout atual do app (com seções "Selecionados para você", "Compre e pontue", "Achadinhos", etc.) e usar o dark mode preview corretamente com tokens do Design System em vez de cores da marca.

### Arquivos (~15 arquivos)

| Arquivo | Escopo |
|---|---|
| `src/lib/utils.ts` | Fix centralizado do `hslToCss` |
| 10 páginas customer | Remover cópia local, importar de utils |
| `BranchPickerSheet.tsx` | Usar CSS vars |
| `OfferPurposeBadge.tsx` | Tokens semânticos |
| `RedemptionCard.tsx` | Status badges dark-safe |
| `CustomerOfferDetailPage.tsx` | Cores hardcoded → tokens |
| `BrandThemePreview.tsx` | Layout atualizado + dark correto |

### Regras
- Zero alteração em lógica de negócio, rotas, queries
- Somente cores de apresentação e contraste

