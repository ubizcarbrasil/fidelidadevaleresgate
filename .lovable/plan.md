

## Plano: Facilitar acesso à página de Módulos no painel do empreendedor

### Problema
A página **Módulos** (`/brand-modules`) está escondida no final do sidebar, dentro do grupo "Configurações". No mobile, o usuário precisa rolar muito para encontrá-la.

### Solução
Duas melhorias simples para tornar o acesso mais fácil:

#### 1. Mover "Módulos" para uma posição mais visível no sidebar
- No arquivo `src/components/consoles/BrandSidebar.tsx`, mover o item "Módulos" do grupo "Configurações" (final do sidebar) para o grupo "Guias Inteligentes" (topo do sidebar), que é o primeiro grupo visível após o Dashboard.
- Isso garante que o empreendedor veja "Módulos" logo no início do menu.

#### 2. Adicionar atalho de "Módulos" nos Links Úteis do dashboard
- No arquivo `src/components/dashboard/DashboardQuickLinks.tsx`, adicionar um card "Módulos" na seção de Links Úteis, com navegação SPA (`navigate("/brand-modules")`).
- Assim, direto da tela inicial, o empreendedor consegue acessar a gestão de módulos com um clique.

### Arquivos envolvidos
- `src/components/consoles/BrandSidebar.tsx` — reposicionar item "Módulos"
- `src/components/dashboard/DashboardQuickLinks.tsx` — adicionar atalho rápido

### Resultado
- "Módulos" aparece no topo do sidebar, fácil de encontrar
- Um botão "Módulos" aparece nos Links Úteis do dashboard
- Sem recarregamento de página, navegação instantânea

