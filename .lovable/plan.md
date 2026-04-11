

## Plano: Corrigir navegação dos links do dashboard que causam recarregamento e perda de contexto

### Causa raiz
A alteração anterior trocou `window.open(..., "_blank")` por `window.location.href`, o que corrigiu o problema de nova aba no mobile. Porém, `window.location.href` faz um **recarregamento completo do app**, forçando o AuthContext, BrandContext e ModuleGuard a reinicializar do zero. Durante essa reinicialização, o `ModuleGuard` pode não encontrar os módulos ainda e redirecionar para `/`, ou a página de destino (como `/branch-wallet`) pode não ter `currentBranchId` resolvido e mostrar "Nenhuma cidade vinculada ao seu perfil."

A solução correta é usar **React Router `navigate()`** para links internos do admin, mantendo o SPA ativo e preservando todo o contexto autenticado.

### Mudanças

#### 1. `src/components/dashboard/DashboardQuickLinks.tsx`
- Importar `useNavigate` do React Router
- Classificar os links em **internos** (admin: Gamificação, Painel Franqueado, Painel Parceiro, Cadastro Parceiro) e **externos** (App do Cliente, Achadinho Motorista)
- Links internos: usar `navigate(link.path)` (SPA navigation, sem recarregamento)
- Links externos: manter `window.location.href` ou `window.open` conforme o contexto

#### 2. `src/pages/DriverPanelConfigPage.tsx`
- Verificar se o botão "Abrir Painel do Motorista" também usa `window.location.href` para rota interna e, se sim, trocar para `navigate()`

### Resultado esperado
- Clicar em "Gamificação" abre a página instantaneamente sem recarregamento
- Clicar em "Painel Franqueado" mantém o contexto de auth e mostra o conteúdo correto
- Todos os links internos do admin funcionam como navegação SPA

### Arquivos envolvidos
- `src/components/dashboard/DashboardQuickLinks.tsx`
- `src/pages/DriverPanelConfigPage.tsx` (verificação)

