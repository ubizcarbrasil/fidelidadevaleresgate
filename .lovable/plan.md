

## Problema

`touchAction: "pan-x"` nos containers de scroll horizontal bloqueia completamente o scroll vertical quando o dedo toca em cima de um card. O browser interpreta que apenas gestos horizontais são permitidos, impedindo a página de rolar para baixo.

## Solução

Trocar `touchAction: "pan-x"` por `touchAction: "pan-x pan-y"` em todos os containers de scroll horizontal dos Achadinhos. Isso permite que o browser decida a direção do gesto (horizontal vs vertical) baseado no movimento do dedo.

### Arquivos e locais

**`src/components/driver/DriverMarketplace.tsx`** — 3 locais:
- Linha 349: modo 1 linha
- Linha 367: modo multi-linha (cada row)
- Linha 399: "Outras ofertas"

**`src/components/customer