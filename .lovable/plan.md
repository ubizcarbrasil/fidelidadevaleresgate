

## Plano: Fix do redirect no portal `app.valeresgate.com.br`

### Diagnóstico

Analisando o `AppContent` (linhas 329-427 do App.tsx), a lógica do portal está na posição correta (linha 371, antes do bloco white-label genérico na linha 400). Porém há um problema sutil:

1. **Linha 362**: O guard `(loading || authLoading) && !isPublicPath` mostra spinner enquanto carrega. `/` não é public path, então espera corretamente.
2. **Linha 371-398**: O bloco portal verifica `isPortalDomain && isWhiteLabel`.
3. **Problema potencial**: Quando `authLoading` termina com `user = null`, o `loading` do brand pode ainda estar `true` (o safety timeout é 3s). Nesse caso, o spinner fica preso até o brand resolver. Se o brand falhar ou demorar, o usuário fica no spinner e nunca é redirecionado.
4. **Outro problema**: A checagem `!user || authLoading` na linha 378 pode causar flash — se `authLoading` ainda é true quando o brand já resolveu, ele redireciona para `/auth` prematuramente, e depois quando auth resolve com user logado, faz outro redirect.

### Correção

Tornar o portal check mais robusto, movendo-o para ANTES do guard de loading para o caso específico do redirect `/` → `/auth`:

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Mover a detecção do portal domain para antes do loading guard. Se `isPortalDomain` e o path é `/` e não há sessão, redirecionar para `/auth` imediatamente (sem esperar brand resolver). Manter o bloco existente para usuários logados. |

### Lógica atualizada no AppContent

```text
1. Partner landing / Driver panel (existente, sem mudança)
2. Public paths check (existente, sem mudança)
3. ** NOVO: Portal domain + não logado + path não-público → Navigate /auth **
   - Não precisa esperar brand loading
   - Apenas checa hostname + !user + !authLoading
4. Loading guard (existente)
5. Portal domain + logado → role-based routing (existente, sem mudança)
6. White-label genérico (existente, sem mudança)
```

A mudança é mínima: adicionar um early return antes da linha 362 que detecta o portal e redireciona para `/auth` sem aguardar o brand resolver, eliminando o problema de timing.

