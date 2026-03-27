
## Diagnóstico

O problema voltou a acontecer porque a aplicação continua travando antes mesmo do React começar a executar.

A evidência mais forte é esta:
- a tela permanece em `Fase: ENTRY_LOADING`
- o replay mostra que ela nunca sai dessa fase
- não há logs do `MAIN_MODULE_START`
- não há transição para `BOOTSTRAP`

Isso significa que o navegador não chegou a executar nenhuma linha útil de `src/main.tsx`.

## Causa mais provável

A correção anterior resolveu só uma parte do gargalo.

Hoje `src/main.tsx` ainda importa estaticamente:

```ts
import { setBootPhase } from "@/lib/bootState";
```

Mas `src/lib/bootState.ts` importa React:

```ts
import { useSyncExternalStore } from "react";
```

Ou seja: o entrypoint ainda depende de React para começar. Então o boot continua vulnerável a travar antes da primeira linha executar.

Além disso, o `index.html` usa:

```html
<script type="module" src="/src/main.tsx"></script>
```

Se esse módulo falhar ao carregar, parsear ou resolver dependências, o `try/catch` dentro de `main.tsx` nunca roda. Resultado: a UI fica parada em `ENTRY_LOADING` e só mostra o botão de recarregar.

## O que está acontecendo na prática

Fluxo atual:

```text
index.html
  └── define ENTRY_LOADING
  └── tenta carregar /src/main.tsx
       └── main.tsx ainda depende de bootState
            └── bootState depende de react
```

Se qualquer etapa acima falhar ou demorar demais, a app não avança e o overlay nunca é desmontado.

## Plano de correção

### 1. Separar o estado de boot em duas camadas
Refatorar `src/lib/bootState.ts` para remover a dependência de React do núcleo do boot.

Estrutura proposta:
- `src/lib/boot_state_core.ts`
  - `setBootPhase`
  - `getBootPhase`
  - `dismissBootstrap`
  - subscribe/listeners
- `src/lib/use_boot_ready.ts`
  - `useSyncExternalStore`
  - `useBootReady`

Assim, `main.tsx` passa a importar só a versão sem React.

### 2. Tornar o entrypoint realmente leve
Atualizar `src/main.tsx` para depender apenas de módulos leves:
- CSS
- logger/webVitals/errorTracker
- `boot_state_core`

Objetivo: fazer `MAIN_MODULE_START` e `BOOTSTRAP` aparecerem imediatamente, sem esperar React.

### 3. Mover o carregamento do app para um loader inline no `index.html`
Trocar o `script type="module" src="/src/main.tsx"` por um loader inline com `import("/src/main.tsx")`.

Isso permite:
- capturar falha real do entrypoint com `.catch(...)`
- atualizar a fase para algo como `ENTRY_IMPORT_FAILED`
- mostrar mensagem mais útil
- tentar um único reload com cache-busting antes de desistir

### 4. Mover a normalização de `/index` para antes do import
Hoje o redirect de `/index` para `/` fica dentro de `main.tsx`, mas isso não ajuda se `main.tsx` nem rodar.

Vou mover essa normalização para o loader do `index.html`, antes de importar o app.

### 5. Tratar cache/stale entry de forma defensiva
Como isso está reaparecendo, adicionar proteção no loader inicial:
- detectar primeira falha de import
- recarregar uma vez com marcador anti-loop
- evitar reload infinito
- exibir fase exata da falha se continuar quebrando

### 6. Manter a instrumentação de diagnóstico
Preservar e complementar os marcadores:
- `ENTRY_LOADING`
- `MAIN_MODULE_START`
- `BOOTSTRAP`
- `AUTH_LOADING`
- `AUTH_READY`
- `