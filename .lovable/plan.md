

## Plano: Corrigir scroll horizontal dos Achadinhos no painel do motorista

### Problema
O carrossel horizontal de deals no `DriverMarketplace` (linha 349) não rola no mobile porque falta `touchAction: "pan-x"` e o container pai `max-w-lg` pode estar cortando o overflow.

### Solução

**`src/components/driver/DriverMarketplace.tsx`**

1. **Linha 349** — Adicionar `touchAction: "pan-x"` no style do container de scroll horizontal:
   - De: `style={{ scrollSnapType: "x mandatory" }}`
   - Para: `style={{ scrollSnapType: "x mandatory", touchAction: "pan-x" }}`

2. **Linha ~207** — No container pai `<div className="max-w-lg mx-auto pb-8">`, adicionar `overflow-x-hidden` para que o overflow horizontal seja delegado aos containers internos:
   - Para: `<div className="max-w-lg mx-auto pb-8 overflow-x-hidden">`

3. **Linha ~375** (carrossel de "Outras ofertas" / uncategorized) — Mesmo fix: adicionar `touchAction: "pan-x"` no style do segundo container de scroll horizontal.

### Arquivo envolvido
- `src/components/driver/DriverMarketplace.tsx`

