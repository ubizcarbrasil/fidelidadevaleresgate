
Corrigir a tela em duas frentes, porque o sintoma atual mudou: agora o problema principal é travamento no carregamento, não mais só a imagem.

## Diagnóstico
- A prévia mostra a rota `/auth` parada em “Carregando aplicação…”/loader.
- Os logs indicam dois avisos importantes de `ref`:
  - `Auth` está recebendo `ref`
  - `PlatformLogo` está recebendo `ref`
- Isso sugere incompatibilidade com algum ponto da árvore que espera componentes compatíveis com `forwardRef`, principalmente em combinação com `lazy`, `Suspense` e a montagem inicial.
- O ajuste anterior de contenção da imagem não resolve esse travamento.

## Plano de correção

### 1. Tornar `PlatformLogo` compatível com `ref`
**Arquivo:** `src/components/PlatformLogo.tsx`

- Refatorar o componente para usar `React.forwardRef`
- Encaminhar o `ref` para o elemento renderizado:
  - `<img>` quando houver imagem válida
  - `<div>` no fallback
- Manter a mesma API atual (`src`, `alt`, `className`, `fallbackLabel`, `loading`)

Objetivo:
- Eliminar o warning “Function components cannot be given refs” relacionado ao `PlatformLogo`

### 2. Evitar `lazy` na rota pública de autenticação
**Arquivo:** `src/App.tsx`

- Remover `Auth` do carregamento com `lazyWithRetry`
- Importar `Auth` diretamente
- Manter `lazy` apenas nas páginas pesadas/privadas, onde faz mais sentido

Objetivo:
- Evitar que a tela de login dependa do fluxo de `Suspense` logo no bootstrap
- Reduzir o risco de a rota pública ficar presa no loader inicial

### 3. Revisar a rota `/auth`
**Arquivo:** `src/App.tsx`

- Garantir que `<Route path="/auth" element={<Auth />} />` continue simples, sem wrappers extras
- Não alterar comportamento de navegação nem autenticação

## Resultado esperado
- A tela `/auth` deixa de travar no carregamento
- Os warnings de `ref` ligados a `Auth`/`PlatformLogo` desaparecem
- O formulário volta a renderizar normalmente no mobile
- A logo permanece contida dentro do card

## Observação técnica
Se após isso ainda houver instabilidade, o próximo passo seria revisar o bootstrap (`main.tsx` + `MountSignal`) para garantir que a overlay de carregamento seja sempre descartada mesmo quando houver falha parcial de render. Mas eu começaria por essas duas correções, porque são as evidências mais fortes do problema atual.
