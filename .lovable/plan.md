

## Plano: Remover "Domínios" do sidebar do Empreendedor e manter apenas no Root

### Problema
A página `BrandDomains` não aplica filtro por `brand_id`, mostrando domínios de todas as marcas. Essa é uma funcionalidade administrativa de nível ROOT — empreendedores não devem gerenciá-la.

### Solução
1. **Remover o item "Domínios" do `BrandSidebar.tsx`** — retirar a entrada `{ key: "sidebar.dominios", ... }` do grupo "Técnico".
2. **Manter no `RootSidebar.tsx`** — já existe lá e funciona corretamente para o root admin.
3. **Proteger a rota `/domains`** — garantir que no `App.tsx` a rota esteja acessível apenas para root (ou já esteja dentro de um wrapper `RootGuard`).

### Resultado
- Empreendedores não verão mais "Domínios" no sidebar.
- Root admin continua gerenciando domínios normalmente.
- Nenhuma alteração de banco necessária.

