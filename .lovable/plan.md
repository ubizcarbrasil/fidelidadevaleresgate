

## Diagnóstico: Dashboard travado no loading após criar trial

### Causa raiz
Bug de race condition no hook `useStoreOwnerRedirect`:

1. Após o login automático, `AuthContext` seta `loading = false` **antes** de `fetchRoles` completar (há um `setTimeout` no callback)
2. O `useEffect` em `useStoreOwnerRedirect` roda com `roles = []` (vazio)
3. Como `roles.length === 0`, o hook seta `isRedirecting = true` e inicia uma query de stores
4. Logo em seguida, `roles` carrega com `brand_admin` → o `useEffect` re-executa e o cleanup cancela a query anterior
5. Na nova execução, `hasAdminRole = true` → o hook faz `return` sem nunca setar `isRedirecting = false`
6. **Resultado: spinner eterno**

### Correção
No `useStoreOwnerRedirect.ts`, adicionar reset de `isRedirecting` quando o usuário tem role admin:

```typescript
if (hasAdminRole) {
  setIsRedirecting(false); // ← adicionar esta linha
  return;
}
```

### Arquivo alterado
| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useStoreOwnerRedirect.ts` | Adicionar `setIsRedirecting(false)` antes do `return` quando `hasAdminRole` é true |

