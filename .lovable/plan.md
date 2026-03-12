

## Problema

A logo `/logo-vale-resgate.jpeg` aparece em 3 locais da landing (navbar, hero badge implícito, footer) e provavelmente está "saindo do lugar" porque:

1. **Sem dimensões fixas**: `h-9 w-auto` e `h-7 w-auto` deixam a largura livre, e como `.jpeg` pode ter aspect ratio inesperado, a imagem empurra elementos
2. **Sem `object-contain`**: Se a imagem for retangular/grande, ela distorce o layout
3. **Sem `flex-shrink-0`**: Em telas menores, a imagem pode ser comprimida pelo flexbox

## Correção

Aplicar nos 3 locais onde a logo aparece:

### 1. Navbar (`src/pages/LandingPage.tsx`, linha 27)
```
h-9 w-9 rounded-lg object-contain flex-shrink-0
```

### 2. Footer (`src/components/landing/LandingFooter.tsx`, linha 8)
```
h-7 w-7 rounded-md object-contain flex-shrink-0
```

### 3. Hero — já não tem logo diretamente, apenas a navbar e footer precisam de ajuste.

Mudança simples: adicionar `w-` fixo, `object-contain` e `flex-shrink-0` para garantir que a logo nunca distorça o layout independente das dimensões da imagem original.

