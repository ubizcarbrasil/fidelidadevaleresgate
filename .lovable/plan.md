

## Plano: Restringir Section Templates ao ROOT_ADMIN

### Problema
A página "Seções da Home" (`/templates`) aparece no menu da marca (`BrandSidebar`), mas é uma ferramenta técnica que só deveria ser acessível ao ROOT_ADMIN.

### Mudanças

1. **`src/components/consoles/BrandSidebar.tsx`** — Remover o item `{ key: "sidebar.secoes_home", defaultTitle: "Seções da Tela Inicial", url: "/templates", ... }` da seção "Vitrine do App".

2. **`src/App.tsx`** — Na rota `/templates`, trocar o `ModuleGuard` por uma verificação de role ROOT_ADMIN (usando `ProtectedRoute` com checagem de `isRootAdmin`, ou simplesmente mantendo a rota acessível apenas pelo menu ROOT que já está protegido). A rota já está dentro do layout protegido, e como só o `RootSidebar` terá o link, basta remover do `BrandSidebar`. Opcionalmente, adicionar um guard explícito na rota para segurança extra.

### Arquivos
- `src/components/consoles/BrandSidebar.tsx` — remover 1 linha
- `src/App.tsx` — (opcional) adicionar guard de root na rota `/templates`

