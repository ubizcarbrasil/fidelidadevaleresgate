

## Plano: Bypass do branch picker no portal domain para usuários não autenticados

### Diagnóstico

O redirect na linha 363 do `AppContent` funciona corretamente em teoria, mas há uma condição de corrida: o `BranchSelector` dentro de `WhiteLabelLayout` pode renderizar brevemente antes do redirect executar, especialmente se `authLoading` terminar depois de `loading` do brand. Além disso, se por qualquer motivo o fluxo chegar ao `WhiteLabelLayout` (linha 402) sem usuário logado, o branch picker bloqueia a tela.

### Correção

Duas alterações defensivas:

| Arquivo | Alteração |
|---------|-----------|
| `src/components/BranchSelector.tsx` | Adicionar check: se `hostname === "app.valeresgate.com.br"` e não há usuário autenticado (`useAuth`), retornar `null` — não renderizar o picker |
| `src/components/WhiteLabelLayout.tsx` | Adicionar check similar: se é portal domain e não há usuário, não mostrar branch picker — redirecionar para `/auth` via `Navigate` |

### Lógica no WhiteLabelLayout

```text
const isPortalDomain = window.location.hostname === "app.valeresgate.com.br";

// Se portal e não logado, redirecionar para /auth em vez de mostrar branch picker
if (isPortalDomain && !authLoading && !user) {
  return <Navigate to="/auth" replace />;
}

// Resto do fluxo normal...
```

### Lógica no BranchSelector (defesa extra)

```text
// Já importa useAuth ou recebe como prop
if (isPortalDomain && !user) return null;
```

### Impacto
- Apenas `app.valeresgate.com.br` é afetado
- Outros domínios white-label continuam com branch picker normal
- Usuários logados no portal continuam vendo o picker se necessário

