

# Correção: moduleKey do Catálogo + Filtro brand_id

## Inconsistências encontradas

| Local | moduleKey atual |
|-------|----------------|
| `App.tsx` (rota) | `"stores"` |
| `BrandSidebar.tsx` | `"catalog"` |
| `BranchSidebar.tsx` | `"stores"` |
| `StoreOwnerPanel.tsx` | `"catalog"` |

O correto é `"catalog"` em todos os lugares, pois o módulo de catálogo tem sua própria definição separada de "stores".

## Alterações

### 1. `src/App.tsx` (linha 180)
Trocar `moduleKey="stores"` por `moduleKey="catalog"` na rota `/store-catalog`.

### 2. `src/components/consoles/BranchSidebar.tsx` (linha 44)
Trocar `moduleKey: "stores"` por `moduleKey: "catalog"` no item "Catálogo".

### 3. `src/pages/StoreCatalogPage.tsx`
- Importar `useBrandGuard` e extrair `currentBrandId`, `applyBrandFilter`, `isRootAdmin`.
- Na query de `stores`, aplicar `applyBrandFilter` para que só traga lojas da marca atual (non-root).
- Na query de `catalog-items`, aplicar `applyBrandFilter` via join ou filtro direto (se a tabela tem `store_id`, filtrar lojas da brand via subquery ou adicionar o brand filter na query de stores e usar os IDs).
- Na mutation `save`, usar `enforceBrandId` se a tabela possuir `brand_id`, ou garantir que o `store_id` selecionado pertença à marca.
- Adicionar `currentBrandId` nas queryKeys para invalidação correta.

