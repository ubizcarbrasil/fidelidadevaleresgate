

## Regras de exposição inteligente de categorias

### Alterações em 2 arquivos

#### Lógica (igual nos dois arquivos)

**Constantes:**
- `MIN_DEALS = 3` — mínimo para exibir categoria
- `MIN_PER_ROW = 3` — mínimo de deals por linha

**No `useMemo` de categorias (substituir o sort atual):**

1. Contar deals por categoria
2. Categorias com < 3 deals → removidas, seus deals vão para "Outras ofertas" via `overflowDealIds`
3. Ordenação:
   - Categorias com `order` definido no admin → posição fixa entre si
   - Categorias sem `order` → depois das fixas, ordenadas por quantidade de deals (desc)
4. `effectiveRows = Math.min(configuredRows, Math.max(1, Math.floor(dealCount / MIN_PER_ROW)))` — linha extra só se tiver ≥ 6 deals (2 linhas), ≥ 9 (3 linhas)

**Na seção "Outras ofertas":** incluir deals cujo `id` está em `overflowDealIds` (além dos já sem categoria)

#### 1. `src/components/customer/AchadinhoSection.tsx`
- Linhas 163-172: substituir `useMemo` de `categories` pela lógica acima, retornando `{ viableCategories, overflowDealIds }`
- Linha 314: trocar `effectiveRows` para usar `MIN_PER_ROW`
- Linha 361: na seção uncategorized, incluir deals com `id` em `overflowDealIds`

#### 2. `src/components/driver/DriverMarketplace.tsx`
- Linhas 183-191: mesma substituição do `useMemo`
- Linha 423: trocar `effectiveRows` para usar `MIN_PER_ROW`
- Na seção uncategorized, incluir overflow deals

