

# Exibir banner da categoria acima dos produtos no AchadinhoSection

## Problema
Quando uma categoria de achadinhos é acionada (selecionada pelo pill), os banners da categoria não aparecem na seção inline da home. Eles só existem nas páginas completas de categoria (`AchadinhoCategoryPage` e `DriverCategoryPage`), onde já ficam acima dos produtos.

O objetivo é carregar o banner da categoria ativa na seção da home, posicionado **acima** dos produtos como uma "capa de abertura".

## Alterações

### 1. `src/components/customer/AchadinhoSection.tsx`
- Adicionar query para buscar banners de `affiliate_category_banners` quando uma categoria está selecionada (`selectedCat`)
- Renderizar o banner carousel **antes** dos carrosséis de produtos da categoria ativa (entre o header da categoria e os deals)
- Usar o mesmo estilo de banner carousel das category pages (aspect-ratio 21/9, dots de navegação, rounded-2xl)
- Só buscar e exibir quando `selectedCat` não é nulo e não é virtual (`__new_offers__`)

### 2. Estrutura de renderização por categoria (linha ~364):
```
Antes:
  Header da categoria → Carrosséis de produtos

Depois:
  Header da categoria → Banner carousel (se houver) → Carrosséis de produtos
```

### Nenhuma alteração nas category pages
`AchadinhoCategoryPage.tsx` e `DriverCategoryPage.tsx` já têm os banners acima dos produtos — permanecem inalterados.

