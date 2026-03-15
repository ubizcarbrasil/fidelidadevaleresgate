

## Plano: Corrigir ícone de categoria faltando no Achadinhos

### Problema
A categoria "Casa" aparece sem ícone na seção Achadinhos. O `LucideIcon` no `AchadinhoSection.tsx` faz lookup direto por `icons[name]` sem converter o nome do banco (kebab-case, ex: `"house"`) para PascalCase (`"House"`). Todos os outros componentes similares usam uma função `kebabToPascal` para essa conversão.

### Correção

**`src/components/customer/AchadinhoSection.tsx`** — Adicionar `kebabToPascal` ao `LucideIcon`:

```typescript
function LucideIcon({ name, className, style }) {
  const pascalName = name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const Icon = (icons as any)[pascalName];
  return Icon ? <Icon className={className} style={style} /> : null;
}
```

Alteração de 1 linha na função existente (linha 36).

