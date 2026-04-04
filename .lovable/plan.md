
Objetivo: corrigir de vez o travamento de boot que acontece antes do React iniciar.

Diagnóstico
- O problema real não está nas páginas, rotas ou regras de negócio.
- O app está morrendo antes de `main.tsx` executar de forma confiável.
- A evidência é forte:
  - o console mostra timeout ainda em fase `ENTRY_SCRIPT_ATTACH`
  - o replay mostra só o overlay do HTML
  - não há sinal útil de execução do `main.tsx`
  - a tela mais recente menciona `ENTRY_SCRIPT_ERROR`, o que indica falha no carregamento do entry ou versão antiga/cacheada do bootstrap

Do I know what the issue is?
- Sim: o gargalo principal está no bootstrap do `index.html` e no carregamento do módulo de entrada no ambiente de preview, não no React em si.

Causa provável
- O loader atual com `<script type="module" src="/src/main.tsx?...">` não está sendo resiliente no preview.
- Existe forte indício de cache/stale bootstrap entre versões, porque a mensagem vista pelo usuário não bate 100% com o HTML atual.
- Enquanto isso não for estabilizado, qualquer ajuste em `App.tsx` ou rotas é secundário.

Plano de correção
1. Reescrever o bootstrap do `index.html`
- Trocar o `<script type="module" src="...">` externo por um loader inline com `type="module"` + `import(...)`.
- Fazer o import com cache-busting real por timestamp.
- Capturar explicitamente:
  - falha de import
  - falha de avaliação
  - promise rejection
  - erro global de runtime

2. Separar fases de boot de verdade
- Padronizar fases como:
  - `BOOT_HTML_READY`
  - `ENTRY_IMPORT_START`
  - `ENTRY_IMPORT_OK`
  - `MAIN_MODULE_START`
  - `REACT_MOUNT_START`
  - `APP_IMPORT_START`
  - `APP_IMPORT_ERROR`
  - `APP_RENDER_ERROR`
- Assim o overlay mostrará exatamente onde morreu, sem mascarar tudo como timeout genérico.

3. Reduzir ainda mais o entry crítico
- Simplificar `src/main.tsx` para depender do mínimo possível antes do primeiro mount.
- Se necessário, criar uma camada mínima de entrada que:
  - monta uma shell simples
  - só depois importa o app completo
- Não mexer no domínio da aplicação até o boot ficar estável.

4. Remover duplicidade de normalização de rota
- Consolidar o tratamento de `/index`, `/index.html` e `/`.
- Deixar essa correção em um único lugar no bootstrap.
- Evitar comportamento inconsistente entre preview e router.

5. Blindar contra ambiente stale
- Exibir no overlay a versão do bootstrap e a fase atual.
- Fazer o loader sempre buscar uma versão fresca do entry.
- Garantir que falhas do módulo mostrem a mensagem real do browser, e não só “não carregou a tempo”.

6. Limpar o escopo desta correção
- Nesta rodada, focar só em:
  - `index.html`
  - `src/main.tsx`
  - possivelmente `src/lib/lazyWithRetry.ts`
- Não tocar em páginas internas, auth, dashboard ou componentes de negócio até o boot abrir normalmente.

Resultado esperado
- O preview deixa de ficar preso em tela roxa sem diagnóstico útil.
- Se o entry falhar, o erro aparece imediatamente com causa real.
- Se o entry carregar, o React monta ao menos uma shell mínima.
- Se o `App` falhar depois, o erro será exibido como `APP_IMPORT_ERROR` ou `APP_RENDER_ERROR`.

Arquivos-alvo
- `index.html`
- `src/main.tsx`
- `src/lib/lazyWithRetry.ts` (se precisar ajustar comportamento de falha)
- `src/App.tsx` apenas se for necessário tirar algo pesado do caminho inicial

Estratégia resumida
```text
Hoje
index.html -> script module externo -> falha silenciosa/instável -> timeout

Depois
index.html -> loader inline com import() e catch real
           -> entry mínimo
           -> mount da shell
           -> import do App
           -> erro específico por fase
```

Risco
- Baixo a médio.
- É uma correção estrutural de bootstrap, com baixo impacto nas regras de negócio.
- O principal cuidado é não introduzir mais uma camada confusa de fallback; a solução precisa ficar mais simples, não mais “defensiva” demais.
