## Diagnóstico

A tela azul não é mais um crash de chunk: o app carrega `App.tsx`, `AuthContext`, `BrandContext`, `AppLayout` e `Dashboard` sem erro fatal no console. O problema atual é um travamento visual por estado de boot/guard:

- `BrandContext` marca `BRAND_READY` cedo demais (`skip-local`).
- Em seguida `AuthContext` volta a fase para `AUTH_LOADING`/`AUTH_READY`.
- `useBootReady()` usa um “high-water mark” que fica pronto após `BRAND_READY`, mas `TelaCarregamento` lê a fase atual via `getBootPhase()` e continua mostrando loader em cima da aplicação.
- Ao mesmo tempo, quando `AppLayout` entra com `consoleScope === "LOADING"`, ele renderiza um shell vazio sem conteúdo, parecendo uma página toda azul/preta.

## Plano cirúrgico

1. Ajustar a máquina de boot em `src/lib/bootStateCore.ts`
   - Tornar as fases monotônicas por prioridade.
   - Impedir regressão visual de `BRAND_READY` para `AUTH_LOADING`/`AUTH_READY`.
   - Quando o boot já estiver resolvido, `getBootPhase()` deve continuar em fase resolvida para não prender loaders antigos.

2. Ajustar o loader em `src/compartilhados/components/tela_carregamento.tsx`
   - Se `isBootResolved()` já estiver true, não tratar `AUTH_LOADING`/`AUTH_READY` posterior como boot ativo.
   - Evitar overlay fullscreen preso após a aplicação já ter montado.

3. Ajustar fallback de `AppLayout` em `src/components/AppLayout.tsx`
   - Para `consoleScope === "LOADING"`, mostrar o loader real/skeleton visível em vez de um shell vazio azul.
   - Isso remove a sensação de “página toda azul” mesmo se permissões demorarem.

4. Validar
   - Rodar verificação TypeScript (`tsc --noEmit`) após a alteração.
   - Abrir `/` e confirmar na prévia que a tela sai do azul e mostra `/auth`, dashboard ou conteúdo carregado conforme sessão.

## O que não vou mexer

- Nada em Campeonato/Motorista.
- Nada em banco, RLS ou funções backend.
- Nada em Service Worker/cache além do comportamento já existente.