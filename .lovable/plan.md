

## Plano: Corrigir preview do app e texto no modo escuro

Dois problemas identificados:

### Problema 1: BrandThemePreview.tsx — Dark mode com texto preto

Na função `resolveColors` (linha 62), o merge aplica `theme.colors` (modo claro) sobre os defaults escuros, antes de aplicar `dark_colors`. Se `dark_colors` não define `foreground`, o valor claro (texto escuro) permanece — resultando em texto preto sobre fundo escuro.

**Correção**: Alterar o merge para não incluir `foreground` e `background` do `theme.colors` quando em dark mode. Somente usar `DARK_DEFAULTS` + `dark_colors` para essas propriedades estruturais.

```typescript
// Antes (linha 62):
const merged = { ...DARK_DEFAULTS, ...theme.colors, ...theme.dark_colors };

// Depois:
const { background: _bg, foreground: _fg, card: _card, muted: _mut, ...colorAccents } = (theme.colors || {});
const merged = { ...DARK_DEFAULTS, ...colorAccents, ...theme.dark_colors };
```

### Problema 2: `--vb-gold-foreground` no dark mode

O token `--vb-gold-foreground: 30 30% 8%` é escuro em ambos os modos. No dark mode, texto sobre o badge dourado deveria ser branco/claro.

**Correção** em `src/index.css`:
```css
/* dark */
--vb-gold-foreground: 0 0% 100%; /* branco no dark mode */
```

### Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/components/BrandThemePreview.tsx` | Fix `resolveColors` para não vazar cores claras no dark mode |
| `src/index.css` | `--vb-gold-foreground` no `.dark` → branco |

### Regras
- Zero alteração em lógica de negócio
- Somente correção de apresentação/contraste

