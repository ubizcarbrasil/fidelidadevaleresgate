

## Diagnóstico: Menu Gamificação no Sidebar

### Situação atual

| Item | Status |
|---|---|
| **Rota `/gamificacao-admin`** no App.tsx | ✅ Existe, protegida por `ModuleGuard moduleKey="achadinhos_motorista"` |
| **BranchSidebar** (franqueado) | ✅ Tem o item "Duelos & Ranking" com `scoringFilter: "DRIVER"` e `moduleKey: "achadinhos_motorista"` |
| **BrandSidebar** (empreendedor) | ❌ **Faltando** — nenhum item de Gamificação |

### Problema

O empreendedor (Brand Admin) **não vê** o menu Gamificação no sidebar. Apenas o franqueado (Branch Admin) consegue acessar.

### Correção

**Arquivo: `src/components/consoles/BrandSidebar.tsx`**

Adicionar um grupo "Gamificação" com `scoringFilter: "DRIVER"` na lista de grupos do BrandSidebar, posicionado após "Programa de Fidelidade" (mesmo local que no BranchSidebar):

```ts
{
  label: "Gamificação",
  scoringFilter: "DRIVER",
  items: [
    { key: "sidebar.gamificacao", defaultTitle: "Duelos & Ranking", url: "/gam