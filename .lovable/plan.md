

# Filtro de produtos Ativos/Inativos na página Produtos de Resgate

## Alterações

### `src/pages/ProdutosResgatePage.tsx`

1. **Novo estado `statusFilter`** com valores `"all" | "active" | "inactive"`, default `"all"`.

2. **Botões de filtro** renderizados entre os KPIs e o `DataTableControls`, seguindo o mesmo padrão visual da página de Achadinhos (botões `Todos`, `Ativos`, `Inativos`).

3. **Query atualizada**: incluir `statusFilter` na queryKey e aplicar `.eq("is_active", true/false)` conforme o filtro selecionado.

4. **Reset de página**: ao mudar o filtro, resetar `page` para 1.

5. **Ajuste no `isEmptyNoSearch`**: considerar também se não há filtro ativo (`statusFilter === "all"`) para decidir se mostra o estado vazio global ou o estado vazio de busca/filtro.

