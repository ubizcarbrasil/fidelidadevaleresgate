

## Etapa 2 — Overlay reativo ao bootState

### Problema atual
O overlay roxo (`#bootstrap-fallback`) só é removido por dois caminhos:
1. `MountSignal` chama `window.__dismissBootstrap()` — funciona no sucesso
2. Timeout de 10s mostra botão de recarregar — mas não explica o motivo

Se o React monta mas falha dentro do `ErrorBoundary`, o overlay fica **por cima** do fallback do React, escondendo a mensagem de erro. Resultado: tela roxa presa.

### Mudanças (3 arquivos, conservadoras)

**1. `src/lib/bootState.ts` — adicionar `dismissBootstrap` helper**

Extrair a lógica de remover o overlay para uma função reutilizável:

```typescript
export function dismissBootstrap() {
  const el = document.getElementById("bootstrap-fallback");
  if (el) el.style.display = "none";
}
```

Modificar `setBootPhase` para chamar `dismissBootstrap()` automaticamente quando a fase for `APP_MOUNTED` ou `FAILED`. Assim qualquer caminho — sucesso ou erro — remove o overlay.

**2. `src/components/ErrorBoundary.tsx` — garantir overlay removido em erro**

No `componentDidCatch`, após chamar `setBootPhase("FAILED", ...)`, chamar também `dismissBootstrap()` explicitamente (defesa em profundidade). Isso garante que o fallback do React (com mensagem de erro e botão) fique visível.

**3. `index.html` — simplificar timeout e integrar com bootState**

Substituir o script de timeout atual por uma versão que:
- Usa o mesmo `__dismissBootstrap` existente
- Se o overlay ainda estiver visível após 12s, mostra o botão de recarregar COM a fase atual do boot (lida de `window.__BOOT_PHASE__`)
- Exportar `window.__BOOT_PHASE__` no `setBootPhase` para o script vanilla poder ler

Mudança no script do `index.html`:
```javascript
window.__dismissBootstrap = function(){
  var el = document.getElementById('bootstrap-fallback');
  if(el) el.style.display='none';
};
setTimeout(function(){
  var el = document.getElementById('bootstrap-fallback');
  if(el && el.style.display !== 'none'){
    var phase = window.__BOOT_PHASE__ || 'desconhecido';
    var spinner = document.getElementById('bootstrap-spinner');
    var err = document.getElementById('bootstrap-error');
    if(spinner) spinner.style.display='none';
    if(err){
      err.style.display='block';
      err.innerHTML = '<p style="margin:0 0 8px;font-size:13px;color:#a78bfa;">Fase: '+phase+'</p>'
        + '<p style="margin:0 0 12px;font-size:14px;">O carregamento está demorando mais que o esperado.</p>'
        + '<button onclick="window.location.reload()" style="background:#6d4aff;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;">Recarregar</button>';
    }
  }
}, 12000);
```

Mudança no `setBootPhase` (bootState.ts):
```typescript
(window as any).__BOOT_PHASE__ = phase;
```

### Como funciona após a mudança

**Sucesso normal:**
1. `BOOTSTRAP` → `AUTH_LOADING` → `AUTH_READY` → `BRAND_LOADING` → `BRAND_READY` → `APP_MOUNTED`
2. `setBootPhase("APP_MOUNTED")` chama `dismissBootstrap()` → overlay some

**Erro fatal no React (ErrorBoundary):**
1. `BOOTSTRAP` → ... → `FAILED`
2. `setBootPhase("FAILED")` chama `dismissBootstrap()` → overlay some
3. Fallback do ErrorBoundary fica visível com mensagem e botão

**Erro fatal no bootstrap (main.tsx):**
1. `BOOTSTRAP` → `FAILED`
2. `setBootPhase("FAILED")` chama `dismissBootstrap()` → overlay some
3. `showBootstrapError()` mostra mensagem no `#bootstrap-error` (que agora está visível)

**Timeout (nada montou em 12s):**
1. Overlay ainda visível → script vanilla mostra fase atual + botão de recarregar
2. Usuário vê "Fase: AUTH_LOADING" e sabe onde travou

### Arquivos alterados
| Arquivo | Mudança |
|---|---|
| `src/lib/bootState.ts` | +`dismissBootstrap()`, +`window.__BOOT_PHASE__`, auto-dismiss em APP_MOUNTED/FAILED |
| `src/components/ErrorBoundary.tsx` | +`dismissBootstrap()` no `componentDidCatch` |
| `index.html` | Timeout mostra fase do boot, remove `__APP_MOUNTED__` check redundante |

### O que NÃO muda
- `MountSignal.tsx` — continua funcionando como antes (chama `setBootPhase` que agora faz dismiss)
- `main.tsx` — sem alteração (já chama `setBootPhase("FAILED")`)
- Guards, redirects, auth, brand, layout, páginas — nada alterado

