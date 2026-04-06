
## Diagnóstico
Do I know what the issue is? Sim.

O erro atual não está mais no React nem no timeout do boot. Ele acontece antes da aplicação iniciar:
- `index.html` faz `import("/src/main.tsx?v=" + ver)`.
- Em preview e publicação, `/src/main.tsx` não existe como arquivo público; o build do Vite só reescreve entradas estáticas para bundles em `/assets/...`.
- Como esse import é dinâmico e montado em runtime, ele não é transformado pelo build. O navegador então tenta carregar um módulo inválido e dispara `ENTRY_IMPORT_FAILED` / `Importing a module script failed.`.
- Isso explica por que `main.tsx` nunca executa e por que a tela para logo no começo.

## O que vou implementar
1. Corrigir a entrada da aplicação em `index.html`
- Remover o `import("/src/main.tsx?v=" + ver)`.
- Voltar para uma entrada estática gerenciada pelo Vite.
- Manter o bootstrap overlay e os logs de fase.

2. Criar uma entrada segura para o boot
- Usar um arquivo de entrada dedicado (ex.: `src/entry-client.ts`) para:
  - marcar `ENTRY_IMPORT_START`
  - importar `main.tsx` com import estático
- Assim o Vite gera o bundle correto e o navegador passa a carregar o asset compilado certo.

3. Remover o cache-busting que quebrou o build
- Parar de usar `?v=` no caminho de `/src/main.tsx`.
- Deixar o cache-busting com o hash nativo do Vite.
- O meta `app-version` pode continuar apenas para diagnóstico.

4. Blindar o fluxo de PWA para não repetir o problema
- Ajustar `vite.config.ts` para não depender de registro automático de service worker em contextos de preview/iframe.
- Se necessário, trocar para registro manual e condicional.
- Manter apenas limpeza pontual de caches antigos, sem voltar ao desregistro global em todo carregamento.

5. Recuperação para clientes presos na versão quebrada
- Adicionar uma recuperação controlada para limpar cache/SW antigos onde ainda existir a versão ruim em cache.
- Essa recuperação será escopada para não recriar o ciclo de atualização quebrado.

## Arquivos envolvidos
- `index.html`
- `vite.config.ts`
- `src/main.tsx`
- novo arquivo de entrada do cliente, se necessário
- possivelmente o fluxo de PWA/registro do SW

## Validação
- Abrir preview e URL publicada.
- Confirmar a sequência no console: `ENTRY_IMPORT_START` → `main.tsx executing` → `REACT_MOUNT_START` → `APP_MOUNTED`.
- Confirmar que `ENTRY_IMPORT_FAILED` desapareceu.
- Testar recarga no mobile e acesso direto em `/` e `/index`.
