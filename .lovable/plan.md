
Diagnóstico

Do I know what o problema é? Sim.

A falha mais provável agora não está mais no `BrandContext` nem nas rotas. Ela acontece antes do React montar.

Evidências no código:
- O spinner roxo vem do `#bootstrap-fallback` em `index.html`.
- Em `src/main.tsx`, esse fallback só sairia se o bundle chegasse a executar.
- O import mais perigoso no bootstrap é `src/integrations/supabase/client.ts`, que instancia o client com `storage: localStorage`.
- Em preview dentro de iframe, acesso a `localStorage`/`sessionStorage` pode falhar com `SecurityError`/`Access denied`.
- Se isso acontecer durante a avaliação dos imports, o React nem monta, o `ErrorBoundary` nunca entra, e o spinner roxo fica para sempre.

Plano de correção

1. Blindar storage antes do bundle carregar
- Arquivo: `index.html`
- Adicionar um script inline mínimo antes de `/src/main.tsx` para:
  - testar `localStorage` e `sessionStorage` com `try/catch`
  - se falhar, instalar fallback em memória com a mesma interface básica (`getItem`, `setItem`, `removeItem`, `clear`, `key`, `length`)
  - expor isso em `window.localStorage` e `window.sessionStorage`
- Motivo: resolve a causa raiz sem editar o arquivo gerado `src/integrations/supabase/client.ts`.

2. Corrigir o handshake de bootstrap
- Arquivo: `src/main.tsx`
- Não remover o `#bootstrap-fallback` antes da hora.
- Fazer o mount com proteção:
  - `try/catch` ao redor do bootstrap
  - marcar explicitamente quando a app montou
  - só então esconder/remover o fallback
- Se der erro antes do mount, trocar o spinner infinito por estado recuperável com mensagem curta + botão de recarregar.

3. Manter o restante intacto
- Não mexer em rotas, providers, auth, layout ou regras de negócio.
- Não refatorar `App.tsx`, `BrandContext` ou páginas além do estritamente necessário.
- Manter as proteções já existentes de lazy import, timeout e boundaries.

Validação
- Confirmar que `/index`, `/` e `/auth` deixam de travar no spinner roxo no preview.
- Confirmar que o app continua usando o storage nativo quando ele estiver disponível.
- Confirmar que o fallback em memória só entra quando o navegador negar acesso ao storage.
- Confirmar que `lazyWithRetry` continua funcional e não entra em loop.

Arquivos a alterar
- `index.html`
- `src/main.tsx`
- Opcional, somente se necessário após validação: `src/lib/lazyWithRetry.ts` para proteger também `sessionStorage` no retry de chunks.

Por que isso resolve
- Hoje o travamento ocorre antes de React, ErrorBoundary e contexts existirem.
- O ajuste em `index.html` atua no estágio mais cedo possível.
- O ajuste em `main.tsx` impede spinner eterno quando o bootstrap falhar.
- Juntos, esses dois pontos atacam exatamente o “limbo” entre HTML estático e montagem real da app.

Detalhe técnico
```text
Cadeia atual:
index.html mostra spinner
-> main/App começam a importar módulos
-> supabase client acessa localStorage
-> preview iframe pode negar storage
-> avaliação do módulo aborta
-> React não monta
-> spinner roxo fica para sempre

Cadeia corrigida:
index.html instala storage seguro primeiro
-> main/App importam normalmente
-> React monta
-> main.tsx remove fallback só após mount confirmado
-> se bootstrap falhar, aparece recuperação visível
```
