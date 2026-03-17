

## Skeleton Loading nas Páginas CRUD

### O que será feito
Substituir os textos "Carregando..." por skeletons visuais usando o componente `DataSkeleton` já existente (`src/components/DataSkeleton.tsx`) nas 4 páginas CRUD admin.

### Alterações por arquivo

**1. `src/pages/OffersPage.tsx`** (linha 171)
- Substituir `<TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>` por `<DataSkeleton variant="table-row" rows={5} />` renderizado fora da `<Table>` (wrap com condição `isLoading` antes do `<Card>`)

**2. `src/pages/StoresPage.tsx`** (linha 245)
- Mesmo padrão: substituir texto loading por `<DataSkeleton variant="table-row" rows={5} />`

**3. `src/pages/RedemptionsPage.tsx`** (linha 61)
- Mesmo padrão: substituir texto loading por `<DataSkeleton variant="table-row" rows={5} />`

**4. `src/pages/CustomersPage.tsx`** (linha 294)
- Desktop: substituir `<p>Carregando...</p>` por `<DataSkeleton variant="table-row" rows={5} />`
- Mobile: adicionar `<DataSkeleton variant="card" rows={4} />` como alternativa mobile quando `isMobile && isLoading`

### Abordagem
- Usar `DataSkeleton` já existente com `variant="table-row"` para tabelas desktop e `variant="card"` para cards mobile
- Quando `isLoading`, renderizar o skeleton **no lugar** da tabela/lista inteira (evita skeleton dentro de `<TableBody>` que ficaria desalinhado)
- Sem novos componentes — apenas importar e usar o `DataSkeleton` existente

### Arquivos afetados
| Arquivo | Ação |
|---------|------|
| `src/pages/OffersPage.tsx` | Editar — skeleton no loading |
| `src/pages/StoresPage.tsx` | Editar — skeleton no loading |
| `src/pages/RedemptionsPage.tsx` | Editar — skeleton no loading |
| `src/pages/CustomersPage.tsx` | Editar — skeleton table + card |

