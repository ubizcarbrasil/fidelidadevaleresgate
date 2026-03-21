

## Plano: Banners intersticiais em carrossel quando houver mais de 1 na mesma posição

### Problema
Quando múltiplos banners são configurados na mesma posição (ex: `__top__` ou após uma categoria), eles aparecem empilhados verticalmente, ocupando muito espaço. O esperado é que fiquem em carrossel automático, igual ao banner principal do topo.

### Correção

**`src/components/driver/DriverMarketplace.tsx`**

Transformar o componente `InterstitialBanner` em `InterstitialBannerGroup` que recebe um array de banners:

- Se houver **1 banner**: renderiza normalmente (imagem simples)
- Se houver **2+ banners**: renderiza em carrossel com auto-advance (4s), dots indicadores e transição suave — mesmo padrão visual do `DriverBannerCarousel`

Ajustar os dois pontos de uso:
1. Banners `__top__` (linha ~348): agrupar e passar array
2. Banners após categoria (linha ~433): agrupar `bannersAfter` e passar array

### Detalhes técnicos
- Reutilizar o padrão de slide único ativo com `useState(current)` + `setInterval` (igual ao `DriverBannerCarousel`)
- Manter `aspect-[21/9]`, `rounded-2xl`, dots sobrepostos na parte inferior
- `touch-action: pan-x pan-y` no container

### Arquivo
- `src/components/driver/DriverMarketplace.tsx`

