

## Plano: Corrigir snap do carrossel multi-linha (rolar por coluna)

### Problema
O container de scroll tem `px-5` (padding) diretamente no elemento com `overflow-x-auto`. Isso faz o bloco inteiro "deslizar" sem encaixar por coluna. O padding interno ao scroll container interfere no cálculo de snap do CSS.

### Solução

**`src/components/driver/DriverMarketplace.tsx` (linhas 356-369)**

Separar o padding do scroll container:
- Remover `px-5` do `div` com `overflow-x-auto`
- Usar `padding-inline` via style (ou `scroll-padding`) para manter o espaçamento visual sem quebrar o snap
- Adicionar `scroll-padding-left: 20px` no container de scroll para que o snap respeite o offset

```
De:
<div className="px-5 grid gap-3 overflow-x-auto scrollbar-hide pb-1" style={{...}}>

Para:
<div className="grid gap-3 overflow-x-auto scrollbar-hide pb-1"
  style={{
    gridTemplateRows: `repeat(${configuredRows}, 1fr)`,
    gridAutoFlow: "column",
    gridAutoColumns: "170px",
    scrollSnapType: "x mandatory",
    touchAction: "pan-x",
    paddingLeft: "20px",
    paddingRight: "20px",
    scrollPaddingLeft: "20px",
  }}>
```

Isso mantém o espaçamento visual mas permite que o snap funcione corretamente por coluna, usando `scroll-padding-left` para compensar o offset.

### Arquivo
- `src/components/driver/DriverMarketplace.tsx`

