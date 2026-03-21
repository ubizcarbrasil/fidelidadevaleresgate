

## Plano: Adicionar botão de compartilhar no AchadinhoDealsOverlay

### O que falta

O `AchadinhoDealsOverlay.tsx` não tem o botão de compartilhar no header. Todas as outras páginas (AchadinhoCategoryPage, DriverCategoryPage, DriverMarketplace, AchadinhoDealDetail) já possuem.

### Implementação

**`src/components/customer/AchadinhoDealsOverlay.tsx`**

1. Importar `Share2` do lucide-react
2. Adicionar botão de compartilhar no header, ao lado direito (após o flex-1 com título), idêntico ao padrão usado nas outras páginas:
   - `h-9 w-9 rounded-xl bg-muted`
   - `navigator.share({ title: category.name + " — Achadinhos", url: window.location.href })`

### Arquivo
- `src/components/customer/AchadinhoDealsOverlay.tsx`

