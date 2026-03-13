

## Diagnóstico: Por que o dark mode não está funcionando

O dark mode **está sendo ativado** (a classe `.dark` é adicionada ao HTML). Porém, o hook `useBrandTheme.ts` aplica as cores da marca **por cima** das variáveis CSS dark, na ordem errada:

```typescript
// Linha 91-92 — BUG:
{ ...DARK_DEFAULTS, ...theme.colors, ...theme.dark_colors }
//  dark defaults OK → light colors OVERRIDE → dark_colors (vazio)
```

A marca "Urbano Norte" tem `theme.colors.background` configurado com valor claro (ex: `"220 20% 97%"`), que sobrescreve o `DARK_DEFAULTS.background` (`"222 47% 7%"`). Como `dark_colors` provavelmente não está configurado, o resultado final é fundo branco.

### Correção

Inverter a ordem do spread em `useBrandTheme.ts` para que dark defaults tenham prioridade sobre as cores light:

```typescript
// CORRETO: light colors primeiro, dark defaults por cima, dark_colors explícitos por último
const basePalette = isDark
  ? { ...theme.colors, ...DARK_DEFAULTS, ...theme.dark_colors }
  : theme.colors;
```

### Arquivo a editar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useBrandTheme.ts` | Linha 91-92: inverter spread order para `{ ...theme.colors, ...DARK_DEFAULTS, ...theme.dark_colors }` |

### Resultado

- Fundo escuro `#0F0F13` aparece automaticamente no customer app
- Cards escuros `#1A1A24`
- Se a marca configurar `dark_colors` explícitos, eles ainda têm prioridade máxima
- Nenhuma lógica alterada — apenas a ordem de prioridade das cores

