

## Resultado da Auditoria de Navegação

Não consigo testar os 4 sidebars via browser porque o sidebar exibido depende do **role do usuário logado** (`consoleScope`). Para testar todos seria necessário 4 contas com roles diferentes (root, tenant_admin, brand_admin, branch_admin). 

Fiz uma auditoria completa por código, comparando todas as URLs nos sidebars com as rotas definidas no `App.tsx`.

### Resultado por Sidebar

**RootSidebar** — Todas as 33 URLs têm rota correspondente no router.

**TenantSidebar** — Todas as 12 URLs têm rota correspondente.

**BrandSidebar** — Todas as 30+ URLs têm rota correspondente. Usa `moduleKey` + `useBrandModules` para filtrar itens.

**BranchSidebar** — Todas as 16 URLs têm rota correspondente. Usa `moduleKey` + `useBrandModules` para filtrar itens.

**OperatorSidebar** — 2 URLs (`/` e `/earn-points`) têm rota correspondente.

### Nenhuma rota quebrada encontrada

Todas as URLs de sidebar apontam para rotas válidas no `App.tsx`. Nenhum link morto.

### Problemas menores encontrados (não relacionados a rotas)

1. **Warning no console**: `DialogFooter` em `PageBuilderV2Page` está recebendo `ref` sem usar `forwardRef`. Isso gera um warning mas não quebra funcionalidade.
2. **Warning de acessibilidade**: `DialogContent` sem `Description` ou `aria-describedby` no mesmo `PageBuilderV2Page`.

### Recomendação

Se quiser testar clicando em cada link visualmente, você precisará fazer login com cada tipo de conta (root, tenant, brand, branch, operator) e navegar manualmente pelo sidebar. Posso testar o sidebar que estiver ativo na sua sessão atual, se desejar.

