

## Problema

Na página "Nova Cidade" (`BranchForm.tsx`), o seletor de marca busca **todas** as marcas ativas sem aplicar o filtro de escopo do usuário (`useBrandGuard`). Um brand_admin da Ubiz Resgata consegue ver "Brand Premium" e "Marca Teste" no dropdown.

## Solução

1. **Importar `useBrandGuard`** no `BranchForm.tsx`
2. **Filtrar a query de brands** usando `applyBrandFilter` — non-root users verão apenas sua própria marca
3. **Auto-preencher `brandId`** quando o usuário tem apenas uma marca (e ocultar o seletor nesse caso, já que não há escolha)
4. Para **root admin**, manter o comportamento atual mostrando todas as marcas

### Arquivo alterado
- `src/pages/BranchForm.tsx`

