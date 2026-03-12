

## Plano: Restringir "Nomes e Rótulos" ao Root Admin

### Problema
Atualmente, o empreendedor (brand_admin) tem acesso à página "Nomes e Rótulos" (`/menu-labels`), podendo alterar nomenclaturas de forma independente. Isso gera inconsistência entre marcas e retrabalho.

### Ações

1. **Remover link do menu do empreendedor** — Excluir a entrada `sidebar.nomes_rotulos` do `BrandSidebar.tsx`

2. **Proteger a rota com RootGuard** — No `App.tsx`, envolver o `<MenuLabelsPage />` com `<RootGuard>` para impedir acesso direto via URL

3. **Manter no RootSidebar** — A entrada já existe no menu raiz e permanece inalterada

