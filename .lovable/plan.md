## Problema

O link que está demorando ~10s é:

```
/webview?url=https://fidelidadevaleresgate.lovable.app/ofertas&...
```

O `WebviewPage` renderiza um `<iframe>` apontando para `/ofertas`. Como a URL é do **mesmo domínio do app**, o navegador acaba carregando o SPA inteiro **duas vezes**:

1. Primeiro o `index.html` + bundle do app para montar o `WebviewPage` (shell com header)
2. Depois, dentro do iframe, **outro** `index.html` + bundle + `PaginaUbizOfertas` + queries do Supabase

Isso explica os ~10s, principalmente em in-app browsers (Instagram, etc.) onde cada boot do React custa caro. O iframe aqui não agrega nada — é uma página interna, não um site externo que precise de sandbox.

## Solução

Detectar links internos (mesmo host) no `openLink` / `WebviewPage` e, nesses casos, **navegar direto** para a rota (`/ofertas`) em vez de abrir o webview com iframe. O webview continua existindo para URLs **externas** (afiliados, parceiros), que é o caso de uso real.

## Mudanças

### 1. `src/lib/openLink.ts`
No bloco `if (mode === "WEBVIEW")`, antes de montar `/webview?...`, verificar se `url` aponta para o mesmo `window.location.origin`. Se sim:
- extrair `pathname + search + hash` da URL
- usar `navigate(path)` (ou `window.location.href = path` como fallback)
- pular completamente o iframe

Tracking continua sendo gravado normalmente antes do branch.

### 2. `src/pages/customer/WebviewPage.tsx` (defesa em profundidade)
No topo do componente, se `url` for do mesmo `origin`, fazer `window.location.replace(pathname+search+hash)` imediatamente. Isso cobre links já compartilhados/salvos com o formato antigo `/webview?url=...mesmo-dominio.../ofertas` para que eles também passem a abrir direto.

### 3. Validação
- Abrir o link problemático: `/webview?url=...%2Fofertas...` deve redirecionar instantaneamente para `/ofertas`, sem montar iframe.
- Abrir um link **externo** via `openLink({mode:"WEBVIEW", url:"https://exemplo.com"})` deve continuar usando o iframe normalmente.
- Conferir no DevTools/Network que o app só carrega o bundle uma vez no caminho interno.

## O que NÃO muda

- `/ofertas` em si não é alterada (já está enxuta na correção anterior do `AuthProvider`).
- O `WebviewPage` continua existindo e funcional para URLs externas.
- Nenhuma mudança de banco, RLS ou edge function.
