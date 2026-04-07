

## Adicionar botão "Acompanhar Duelo" nos cards ao vivo

### Problema
Os cards de duelos ao vivo não têm um botão visível de ação — o card inteiro é clicável mas não há indicação visual clara para o motorista acompanhar o duelo.

### Solução
Adicionar um botão "Acompanhar" no `DuelCard.tsx` que aparece apenas para duelos com status `live` ou `accepted`.

### Alteração

**Arquivo**: `src/components/driver/duels/DuelCard.tsx`

- Importar `Eye` do lucide-react e `Button` do shadcn
- Adicionar uma terceira linha no card com um botão estilizado:

```tsx
{(duel.status === "live" || duel.status === "accepted") && (
  <div className="mt-2 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
    <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
      <Eye className="h-3.5 w-3.5" />
      Acompanhar Duelo
    </Button>
  </div>
)}
```

O botão herda o `onClick` do card pai (abre o `DuelDetailSheet`), mantendo a mesma funcionalidade mas com um CTA visual claro.

