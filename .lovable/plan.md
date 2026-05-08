# Plano: Link WebView para /ofertas

## Objetivo
Disponibilizar um link pronto que abra a rota `/ofertas` dentro da página `WebviewPage` (`/webview`), com cabeçalho fixo, botão de voltar, compartilhar e abrir externamente — ideal para uso em apps/in-app browsers.

## Como funciona
A rota `/webview` já existe (`src/pages/customer/WebviewPage.tsx`) e aceita parâmetros via querystring:
- `url` (obrigatório) — URL a ser carregada no iframe
- `title` — título exibido no cabeçalho
- `header=1` — mostra cabeçalho
- `back=1` — mostra botão voltar
- `share=1` — mostra botão compartilhar

## Mudanças

### 1. `src/features/ubiz_ofertas/components/link_publico_ofertas.tsx`
Adicionar uma segunda seção no card chamada **"Link em modo WebView (cabeçalho + voltar)"**, exibindo um segundo input read-only com a URL no formato:

```
https://app.valeresgate.com.br/webview?url=<encoded /ofertas>&title=<titulo>&header=1&back=1&share=1
```

Reutilizar os mesmos botões (Copiar, Abrir, Compartilhar) já existentes, agora atuando sobre essa URL WebView. Construir a URL a partir do `url` resolvido pelo hook `useLinkPublicoOfertas` (não duplicar lógica de domínio).

Texto explicativo curto: *"Use este link quando precisar embutir a vitrine em apps. Abre dentro do nosso WebView com cabeçalho, voltar e compartilhar."*

### 2. `src/lib/publicShareUrl.ts` (helper opcional)
Adicionar função utilitária `buildWebviewUrl(targetUrl, { title, share })` que monta a URL do `/webview` com os params corretos. Usada pelo componente acima e disponível para reuso futuro (ex.: botão de compartilhar do `CabecalhoOfertas`).

### 3. (Opcional) `src/features/ubiz_ofertas/components/cabecalho_ofertas.tsx`
Sem alteração agora — o botão Compartilhar atual continua compartilhando o link direto. O link WebView fica disponível apenas no painel admin (componente do item 1) para divulgação.

## Resultado para o usuário
No painel de configurações da marca, na seção **Link público da vitrine**, aparecerá um novo bloco com a URL em formato WebView, pronta para copiar e usar dentro do app — abrindo `/ofertas` com cabeçalho, botão voltar e compartilhar nativos da plataforma.
