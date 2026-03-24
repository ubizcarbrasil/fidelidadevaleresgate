
## Correção definitiva da tela branca

### O problema real
Encontrei dois pontos frágeis no bootstrap que explicam a tela branca intermitente:

1. `src/main.tsx` força limpeza de service worker + `window.location.reload()` no preview. Em iframe/preview isso pode virar um ciclo instável e deixar a app carregando em branco.
2. `src/contexts/AuthContext.tsx` usa `onAuthStateChange(async ...)` e libera `loading` antes de a restauração de roles terminar. Isso cria corrida entre sessão, roles, guards e queries. A própria documentação do SDK alerta para deadlock/race ao usar fluxo assíncrono dentro do callback de auth.

Também confirmei que não há erro novo de runtime ligado à rota atual; isso reforça que o defeito é de inicialização, não de um componente específico quebrado.

### O que vou implementar

#### 1. Blindar o preview contra PWA/service worker
Arquivos:
- `src/main.tsx`
- `vite.config.ts`

Mudanças:
- parar de forçar `window.location.reload()` no preview
- desabilitar/neutralizar o registro automático do service worker no ambiente de preview
- manter comportamento PWA só onde realmente faz sentido (site publicado), não no iframe de desenvolvimento

Objetivo:
- eliminar recarregamentos automáticos e estados em branco por bootstrap instável

#### 2. Refatorar a inicialização de autenticação
Arquivo:
- `src/contexts/AuthContext.tsx`

Mudanças:
- remover `async` do callback de `onAuthStateChange`
- transformar qualquer side effect em “fire-and-forget” (`void ...`)
- centralizar a restauração inicial da sessão + roles em uma função controlada
- só marcar auth como pronta depois que sessão e roles forem resolvidas
- proteger contra updates concorrentes/stale com cancelamento simples ou request id

Objetivo:
- impedir deadlock do auth
- impedir que a UI monte com sessão parcial ou roles vazias por alguns instantes

#### 3. Separar “sessão pronta” de “app pronta”
Arquivos:
- `src/App.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RootGuard.tsx`
- `src/components/ModuleGuard.tsx`
- possivelmente `src/hooks/useBrandModules.ts` e `src/hooks/useBrandGuard.ts`

Mudanças:
- garantir que guards não redirecionem enquanto auth/roles ainda estão restaurando
- evitar que páginas dependentes de brand/roles consultem dados cedo demais
- exibir loader visível e estável durante bootstrap, nunca DOM vazio

Objetivo:
- remover os estados intermediários que hoje podem cair em branco ou redirecionar errado

#### 4. Adicionar diagnóstico de bootstrap
Arquivos:
- `src/contexts/AuthContext.tsx`
- `src/lib/errorTracker.ts` (apenas se necessário para contexto melhor)

Mudanças:
- registrar falhas/timeout de inicialização com contexto claro (`auth-init`, `roles-fetch`, `preview-bootstrap`)
- facilitar identificar imediatamente se o problema futuro vier de auth, preview ou query pendurada

Objetivo:
- se voltar a acontecer, o erro ficará explícito em vez de parecer “tela branca sem motivo”

### Resultado esperado
Depois dessa correção:
- o preview deixa de entrar em ciclo frágil de reload/cache
- a sessão não trava mais na restauração
- os guards deixam de renderizar com auth incompleta
- a app sempre mostra loader ou conteúdo, nunca uma tela branca “silenciosa”

### Validação após implementar
Vou validar estes cenários:
1. abrir no preview em `/index`
2. hard refresh no preview
3. recarregar com sessão existente
4. abrir `/auth` sem sessão
5. navegar para `/` e para páginas protegidas
6. repetir no viewport mobile que você está usando

### Arquivos mais prováveis de alteração
- `src/main.tsx`
- `vite.config.ts`
- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/RootGuard.tsx`
- `src/components/ModuleGuard.tsx`
- `src/hooks/useBrandModules.ts`

### Resumo técnico
```text
Causa principal = bootstrap instável
- preview + service worker/reload
- auth init + roles restore em corrida
- guards consultando estado antes da hora
```

```text
Correção definitiva
- sem reload forçado no preview
- sem async perigoso no onAuthStateChange
- auth/roles prontos antes de liberar a app
- guards e queries bloqueados até bootstrap concluir
```
