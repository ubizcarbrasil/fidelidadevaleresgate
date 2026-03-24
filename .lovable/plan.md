
## Diagnóstico mais provável

O problema não parece ser mais um erro de sintaxe. Pelos sinais do projeto:

- o preview está abrindo em `/index`
- a sessão mostra navegações entre `...lovable.app` e `...lovableproject.com/auth`
- não há erro de console capturado
- o redirect atual de `/index` está só dentro do React Router

Isso indica que o app está falhando no bootstrap/roteamento inicial do preview, antes da correção em `App.tsx` conseguir estabilizar a tela. Ou seja: a correção de `/index` foi feita no lugar certo para navegação interna, mas tarde demais para o fluxo de entrada do preview.

## Plano de correção

### 1. Normalizar a URL antes do React montar
**Arquivo:** `src/main.tsx`

Vou mover a correção principal para o bootstrap da aplicação:
- detectar `window.location.pathname === "/index"` e também `/index.html`
- fazer `history.replaceState` para `/` preservando `search` e `hash`
- rodar isso antes do `createRoot(...)`

Isso evita que o preview tente montar a app numa rota inválida antes do Router assumir.

### 2. Blindar as rotas públicas no `App`
**Arquivo:** `src/App.tsx`

Vou endurecer o roteamento para o preview:
- manter `/index -> /`
- adicionar cobertura para variações como `/index/` e `/index.html`
- fazer as rotas públicas (`/auth`, `/reset-password`, `/trial`, `/landing`) renderizarem sem depender do fluxo de console/admin
- evitar que a lógica de white-label interfira na entrada do painel no preview

### 3. Remover estados “vazios” que podem parecer tela branca
**Arquivos:** `src/components/RootGuard.tsx`, `src/components/ModuleGuard.tsx`

Hoje há guards que retornam `null` durante loading. Isso pode virar tela em branco quando o app entra num estado intermediário.

Vou ajustar para:
- mostrar loader consistente em vez de `null`
- deixar explícito quando ainda está carregando autenticação/permissões

### 4. Garantir fallback visível no fluxo de autenticação
**Arquivo:** `src/components/ProtectedRoute.tsx`

Vou revisar o guard principal para:
- esperar o bootstrap inicial da autenticação terminar
- só redirecionar depois disso
- nunca deixar a tela sem conteúdo entre `/index`, `/` e `/auth`

### 5. Validar o fluxo que está quebrando
**Fluxo a validar após implementação**
```text
/index
 -> normaliza para /
 -> ProtectedRoute verifica sessão
 -> sem sessão: /auth
 -> tela de login aparece
```

Também vou conferir que isso não quebra:
- `/customer-preview`
- preview mobile
- acesso já autenticado ao dashboard

## Arquivos a ajustar
- `src/main.tsx`
- `src/App.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RootGuard.tsx`
- `src/components/ModuleGuard.tsx`

## Resultado esperado

Depois dessa correção, o preview não deve mais ficar “todo branco” ao abrir em `/index`. Mesmo sem sessão, a aplicação deve cair de forma previsível na tela de login, com conteúdo visível, em vez de travar num estado em branco.
