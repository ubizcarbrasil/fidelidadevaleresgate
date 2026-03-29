

# Corrigir imagem gigante na tela de login

## Diagnóstico

O arquivo `/logo-vale-resgate.png` (porquinho amarelo em fundo ciano) está sendo exibido como logo na tela de Auth. As classes `h-16 w-16` deveriam limitar a 64x64px, mas no mobile a imagem está escapando do container e preenchendo a tela inteira.

## Alterações

### 1. `src/pages/Auth.tsx` — Forçar contenção do logo

Envolver o `PlatformLogo` em um `div` com tamanho fixo e `overflow-hidden`, e adicionar `style` inline como garantia:

```tsx
<CardHeader className="text-center space-y-2">
  <div className="mx-auto h-16 w-16 overflow-hidden rounded-2xl shadow-md">
    <PlatformLogo
      src={brandLogoUrl || "/logo-vale-resgate.png"}
      alt={brandName || "Vale Resgate"}
      fallbackLabel={brandName ? brandName.substring(0, 2).toUpperCase() : "VR"}
      className="h-full w-full"
    />
  </div>
```

### 2. `src/components/PlatformLogo.tsx` — Adicionar contenção inline

Adicionar `style={{ maxWidth: "100%", maxHeight: "100%" }}` no `<img>` como proteção contra vazamento de imagens grandes:

```tsx
<img
  src={src}
  alt={alt}
  className={cn("object-contain shrink-0", className)}
  style={{ maxWidth: "100%", maxHeight: "100%" }}
  loading={loading}
  onError={() => setFailed(true)}
/>
```

Duas camadas de proteção: container fixo com overflow-hidden + inline styles de max no img.

