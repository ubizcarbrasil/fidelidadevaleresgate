

## Plano: Portal de Login Universal em `app.valeresgate.com.br`

### Problema
Quando um usuário acessa `app.valeresgate.com.br`, o sistema resolve como white-label da Ubiz Resgata e exibe o `WhiteLabelLayout` (app do cliente). O comportamento desejado é que esse domínio funcione como um portal de login universal, redirecionando cada tipo de usuário para seu painel correto.

### Solução

Duas alterações principais:

#### 1. `AppContent` em `src/App.tsx`
Detectar o hostname `app.valeresgate.com.br` e tratá-lo como "portal mode":

- **Não logado** + rota `/` → redirecionar para `/auth`
- **Logado** + rota `/` → redirecionar baseado nas roles:
  - `root_admin` → `/` (AnimatedRoutes/AppLayout normal)
  - `tenant_admin` → `/` (AppLayout)
  - `brand_admin` → `/` (AppLayout)
  - `branch_admin` → `/` (AppLayout)
  - `branch_operator` / `operator_pdv` → `/` (AppLayout)
  - `store_admin` (sem admin role) → `/store-panel`
  - sem role admin → `/auth` (ou WhiteLabelLayout como fallback)
- Quando logado como admin, renderizar `AnimatedRoutes` em vez de `WhiteLabelLayout`

A lógica será inserida dentro do bloco `if (isWhiteLabel)` do `AppContent`, antes do fallback para `WhiteLabelLayout`. Extrair a constante `PORTAL_HOSTNAME = "app.valeresgate.com.br"` para facilitar manutenção.

#### 2. `src/pages/Auth.tsx` — Redirect pós-login
Expandir a lógica de redirect após `signInWithPassword` para considerar o portal domain:

- Se `window.location.hostname === PORTAL_HOSTNAME`:
  - `root_admin` / `tenant_admin` / `brand_admin` / `branch_admin` / `branch_operator` / `operator_pdv` → `navigate("/")`
  - `store_admin` (sem admin role) → `navigate("/store-panel")`
  - Apenas `customer` ou sem role → `navigate("/")` (WhiteLabelLayout normal)

- Se já logado ao acessar `/auth` no portal domain → redirecionar imediatamente pro console correto (adicionar check no topo do componente Auth)

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` (`AppContent`) | Adicionar detecção de portal domain dentro do bloco `isWhiteLabel`, forçar redirect `/` → `/auth` quando não logado, e garantir `AnimatedRoutes` para admins |
| `src/pages/Auth.tsx` | Adicionar redirect automático se já logado no portal domain; expandir lógica pós-login para role-based redirect |

### Regras respeitadas
- Lógica exclusiva para `app.valeresgate.com.br` via `window.location.hostname`
- Nenhum outro domínio white-label é afetado
- BrandContext continua resolvendo normalmente (o domínio já aponta para Ubiz Resgata)
- Compatibilidade total com fluxo existente

