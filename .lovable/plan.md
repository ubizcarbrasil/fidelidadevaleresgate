

# Corrigir link "Painel Franqueado" nos Quick Links

## Problema
O botão "Painel Franqueado" nos Links Úteis do dashboard aponta para `/branch-wallet`. Ao clicar (especialmente no mobile), o usuário é redirecionado para o painel da loja (store-panel) em vez de ver o painel do franqueado. Isso acontece porque:

1. O `window.open` com `noopener,noreferrer` no mobile pode falhar e cair no fallback `window.location.href`, navegando a página atual
2. A rota `/branch-wallet` dentro do `AppLayout` pode não resolver corretamente o contexto de branch para um brand_admin, causando comportamento inesperado
3. O link deveria apontar para o dashboard principal do franqueado (rota `/` com escopo BRANCH), não apenas para a carteira

## Correção

### 1. Atualizar o link em `DashboardQuickLinks.tsx`
Mudar o path do "Painel Franqueado" de `/branch-wallet` para a rota raiz `/` — o mesmo padrão usado pelo "App do Cliente" que já passa `?brandId=`. Para o franqueado, o ideal seria abrir a rota principal que, com escopo BRANCH, mostra o `BranchDashboardSection`.

Como o brand_admin não pode "virar" branch_admin só por URL, a solução pragmática é:
- Manter o link para `/branch-wallet` (que é a página principal do módulo Achadinhos no sidebar do franqueado)
- **Remover `noopener,noreferrer`** do `window.open` para garantir que a sessão auth seja preservada corretamente no mobile
- Alternativamente, usar `window.open(url, "_blank")` sem flags restritivas

### 2. Arquivo a modificar

**`src/components/dashboard/DashboardQuickLinks.tsx`**:
- Linha 37: Alterar `openExternal` para remover as flags `noopener,noreferrer` que podem causar problemas de sessão no mobile:
  ```typescript
  const openExternal = (url: string) => {
    window.open(url, "_blank");
  };
  ```
- Manter o path `/branch-wallet` pois é a página principal de gestão do franqueado no contexto Achadinhos

Essa correção é mínima e resolve o problema de redirecionamento incorreto ao preservar a sessão de autenticação na nova aba.

