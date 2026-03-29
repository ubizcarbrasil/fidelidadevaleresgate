

# Corrigir import dinâmico que trava o boot

## Problema

A função `doImport(url)` no `index.html` usa `import(url)` onde `url` é uma variável. O Vite precisa de caminhos literais (strings estáticas) para resolver módulos ESM. Com uma variável, o dev server simplesmente não serve o arquivo — o import fica pendente para sempre.

## Solução

Reescrever o bloco `<script type="module">` no `index.html` para usar imports com **strings literais**, mantendo a lógica de timeout e retry.

### Arquivo alterado: `index.html` (linhas 138-189)

Substituir o bloco inteiro por:

```javascript
<script type="module">
  (function(){
    var TIMEOUT_MS=15000;

    function showFatalError(){
      window.__BOOT_PHASE__="ENTRY_IMPORT_FAILED";
      var spinner=document.getElementById("bootstrap-spinner");
      var errDiv=document.getElementById("bootstrap-error");
      if(spinner)spinner.style.display="none";
      if(errDiv){
        errDiv.style.display="block";
        errDiv.innerHTML='<p style="margin:0 0 8px;font-size:13px;color:#a78bfa;">Não foi possível conectar ao servidor</p>'
          +'<p style="margin:0 0 12px;font-size:14px;">Verifique sua conexão e tente novamente.</p>'
          +'<button onclick="window.location.reload()" style="background:#6d4aff;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer;">Tentar novamente</button>';
      }
    }

    var timeout=setTimeout(function(){
      console.error("[boot] import timeout");
      showFatalError();
    },TIMEOUT_MS);

    import("/src/main.tsx").then(function(){
      clearTimeout(timeout);
    }).catch(function(err){
      clearTimeout(timeout);
      console.error("[boot] import failed",err);
      showFatalError();
    });
  })();
</script>
```

### O que muda

| Antes | Depois |
|---|---|
| `doImport(url)` com variável | `import("/src/main.tsx")` com string literal |
| `Promise.race` + retry + cache-bust | Timeout simples de 15s com `setTimeout` |
| Múltiplas tentativas com `sessionStorage` | Uma tentativa limpa, botão manual se falhar |

### Por que resolve

O Vite faz análise estática do código-fonte. Quando vê `import("/src/main.tsx")` com string literal, sabe que precisa servir esse módulo. Com `import(url)` via variável, o Vite ignora — o módulo nunca é requisitado ao servidor.

### Escopo

- **Apenas** `index.html`, bloco do script de boot
- Nenhuma mudança em auth, brand, guards, rotas, providers ou lógica da app
- `src/main.tsx` permanece inalterado

