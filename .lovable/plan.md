

## Plano: Remover título e "Ver todos" da seção de Banners

### Problema
A seção de banners mostra um cabeçalho com o título "Banners" e o botão "Ver todos ›" que o usuário quer remover.

### Alteração

**Arquivo**: `src/components/HomeSectionsRenderer.tsx` (linhas 433-449)

Adicionar uma condição para ocultar o header quando o tipo da seção for `BANNER_CAROUSEL`:

```tsx
{/* Section Header */}
{(section.title || section.subtitle) && templateType !== "BANNER_CAROUSEL" && (
  // ... header content remains unchanged
)}
```

### Resultado
A seção de banners não exibirá mais o título "Banners" nem o botão "Ver todos".

| Arquivo | Ação |
|---------|------|
| `src/components/HomeSectionsRenderer.tsx` | Ocultar header para `BANNER_CAROUSEL` |

