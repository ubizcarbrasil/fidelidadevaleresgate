

## Plano: Corrigir encaixe do banner do topo no painel do motorista

### Problema
O banner do topo no `DriverBannerCarousel` usa `aspect-[21/9] max-h-[200px]` que causa problemas de encaixe — a imagem fica mal dimensionada dependendo do tamanho da tela ou proporção da imagem original.

### Solução
Alinhar com o mesmo padrão do app do cliente (`HomeSectionsRenderer > BannerCarousel`), que usa **altura fixa** (`h-40` = 160px) com `object-cover` e `rounded-2xl`, garantindo encaixe consistente.

### Alteração

**`src/components/driver/DriverBannerCarousel.tsx`**
- Trocar `className="w-full aspect-[21/9] max-h-[200px] object-cover rounded-2xl"` por `className="w-full h-40 object-cover rounded-2xl"`
- Isso replica exatamente o comportamento do banner do passageiro (altura "medium" = `h-40`)
- O container já tem `rounded-2xl` e `overflow-hidden`, garantindo visual limpo

