## Diagnóstico

O link `https://fidelidadevaleresgate.lovable.app/driver?brandId=...` funciona no navegador (testado: redireciona 302 para `app.valeresgate.com.br`), mas **não é clicável dentro do app da Ubiz Car**.

Causa provável: o WebView interno do app da Ubiz Car não detecta automaticamente URLs em texto simples como links clicáveis (comportamento comum de WebView Android sem `Linkify`). Isso é uma limitação do app cliente, não do nosso código.

## Solução

Não dá para mudar como o app da Ubiz Car renderiza texto. O que podemos fazer é:

1. **Reduzir o tamanho/atrito do link** para que o motorista consiga copiar/colar mais facilmente, e
2. **Já entregar o link no formato `/webview`** (que é o modo embarcado leve que construímos nas iterações anteriores) com `back=1&header=1`, para abrir bonito quando alguém abrir manualmente.

### Mudanças propostas

**1. Link curto canônico para drivers** (`src/lib/publicShareUrl.ts`)
- Adicionar uma variante `buildDriverShortUrl(origin, brandId)` que retorna `${origin}/d/{brandId}` (rota curta).
- Manter `buildDriverUrl` como fallback compatível.

**2. Nova rota curta `/d/:brandId`** (`src/App.tsx`)
- Adicionar rota pública que faz `Navigate` server-side equivalente para `/driver?brandId=...`.
- Adicionar à lista de `publicPaths`.

**3. Wrapper WebView automático na hora do compartilhamento** (`src/features/ubiz_ofertas/components/link_publico_ofertas.tsx` e qualquer painel admin que mostre o link `/driver`)
- Já existe lógica similar em `link_publico_ofertas.tsx` (gera variante `/webview?url=...`). Replicar o mesmo padrão para o link `/driver` exibido nos painéis de compartilhamento, mostrando 2 links lado a lado:
  - **Link direto (curto)**: `https://app.valeresgate.com.br/d/{brandId}`
  - **Link WebView**: `https://app.valeresgate.com.br/webview?url=...&title=Ofertas&back=1&header=1`
- Botões: copiar, abrir, compartilhar (Web Share API).

**4. Instrução visual nos painéis admin**
- Adicionar nota: *"Em apps que não detectam links automaticamente (ex.: WebView do Ubiz Car), copie e cole o link curto na barra de endereço, ou use o botão Compartilhar."*

### Detalhes técnicos

- A rota `/d/:brandId` é apenas um redirect SPA para `/driver?brandId=...`, preservando o resto da query string.
- Não há mudança de backend, edge function ou banco de dados.
- Tudo permanece dentro de frontend/presentation, conforme regra do workspace.

### O que NÃO resolve este plano

Se o problema for que o app da Ubiz Car **renderiza o link como texto plano** sem nenhuma forma de copiar, precisaremos coordenar com o time da Ubiz Car para que o app:
- aplique `Linkify.addLinks()` (Android) nos textos recebidos, ou
- envie a mensagem como HTML com `<a href>`.

Esse ajuste é no app deles, não em código nosso.