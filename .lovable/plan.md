

# Correção: Menus inacessíveis na versão publicada (iOS PWA)

## Diagnóstico

O problema é causado por **falta de padding de safe-area no header do painel administrativo**. 

O app está configurado como PWA com `viewport-fit=cover` e `apple-mobile-web-app-status-bar-style=black-translucent`, o que faz o conteúdo renderizar **por baixo da barra de status do iOS**. O header (onde fica o botão de menu/hamburger) não usa a classe `pwa-safe-top` — diferente do `StoreOwnerPanel` e do `UnifiedEditor`, que já aplicam essa classe corretamente.

Resultado: o botão de abrir o menu lateral fica escondido atrás da barra de status do iPhone e não responde ao toque.

## Correção

### Arquivo: `src/components/AppLayout.tsx`

Adicionar a classe `pwa-safe-top` ao header do layout para empurrar o conteúdo abaixo da safe-area do iOS:

```tsx
// Antes:
<header className="h-14 flex items-center gap-3 px-4 saas-topbar shrink-0 relative z-10">

// Depois:
<header className="h-14 flex items-center gap-3 px-4 saas-topbar shrink-0 relative z-10 pwa-safe-top">
```

Essa é uma alteração de uma linha que resolve o problema sem afetar o layout em desktop ou navegadores sem safe-area (o padding só é aplicado via `@supports`).

