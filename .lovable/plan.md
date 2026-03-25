

## Corrigir sobreposição do banner sobre a imagem do produto

### Problema
O banner rotativo (aspect-ratio 16/9) ocupa a área onde a imagem do produto deveria ficar visível. A imagem do produto flutua com `absolute -bottom-8`, mas o banner a cobre parcialmente — como visível no screenshot com a faixa verde sobre a caixa de som.

### Correção
Reorganizar o layout para que o banner fique **acima** e a imagem do produto fique **abaixo do banner**, sem sobreposição:

**Arquivo: `src/components/customer/AchadinhoDealDetail.tsx`**

1. **Reduzir aspect-ratio do banner** de `16/9` para `3/1` (mais estreito, faixa decorativa)
2. **Mover a imagem do produto para fora do container `relative`** do banner — posicionar como elemento estático abaixo, centralizado, em vez de `absolute -bottom-8`
3. **Remover o spacer `h-12`** que compensava o float (não será mais necessário)
4. **Manter**: rotação, dots, badge, fade transitions — tudo funciona igual

Layout resultante:
```text
┌─────────────────────────┐
│   ← Header buttons  →  │
├─────────────────────────┤
│  Banner (3/1, slim)     │  ← faixa decorativa, sem cobrir produto
│  · · ·  (dots)          │
├─────────────────────────┤
│       ┌────────┐        │
│       │ Produto│        │  ← imagem estática, centralizada, sem overlap
│       └────────┘        │
│     store · título      │
│      R$ 69,99           │
│   [ Ir para oferta ]    │
└─────────────────────────┘
```

Nenhuma mudança em guards, auth, bootstrap ou outras páginas.

