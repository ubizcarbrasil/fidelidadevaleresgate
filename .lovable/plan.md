
Objetivo: corrigir o travamento no bootstrap que voltou a deixar a tela em “preparando ambiente...”.

1. Confirmar a causa raiz no bootstrap
- O problema está concentrado em `src/main.tsx`.
- Hoje o arquivo diz que faz lazy-load do app, mas na prática faz `import App from "./App"` de forma estática.
- Isso quebra a estratégia de bootstrap: o módulo `main.tsx` só executa depois que toda a árvore de imports de `App.tsx` é resolvida, então `MAIN_MODULE_START`, `BOOTSTRAP` e `APP_MOUNTED` ficam atrasados ou nem chegam a disparar a tempo.
- Esse comportamento bate com o sintoma do print: a overlay do `index.html` continua visível e cai no timeout de “preparando ambiente...”.

2. Restaurar a estratégia correta de carregamento
- Alterar `src/main.tsx` para voltar a carregar `App` de forma lazy.
- Manter o `BootShell` mínimo, montando instantaneamente.
- Fazer o `useEffect` do `BootShell` disparar `setBootPhase("APP_MOUNTED")` e `__dismissBootstrap()` logo após o primeiro commit do React, sem depender do carregamento completo do app administrativo.

3. Usar o padrão resiliente já adotado no projeto
- Preferir `lazyWithRetry` para o `App`, em vez de import estático.
- Assim, se houver erro de chunk/caching, o app segue o mesmo padrão de recuperação usado no restante da base.

4. Evitar nova regressão
- Não mexer agora nos arquivos de dashboard (`PointsFeed`, `DashboardChartsSection`, `BrandSidebar`, etc.) nesta correção de boot.
- O foco é isolar o problema no ponto de entrada e voltar ao desenho original de bootstrap em duas camadas.

5. Validação após implementar
- Verificar carregamento em `/index` e `/`.
- Confirmar que a fase sai de `ENTRY_LOADING` rapidamente.
- Confirmar que a overlay some mesmo que páginas internas ainda estejam carregando.
- Confirmar que login e dashboard continuam abrindo normalmente depois do ajuste.

Arquivos a ajustar
- `src/main.tsx`

Detalhe técnico
- O erro não parece ser “dashboard quebrado” em si; o travamento acontece antes do primeiro commit do React.
- A regressão foi introduzida ao trocar o app root de lazy para import estático.
- Em um projeto grande como este, isso reata o bootstrap ao grafo pesado de módulos e volta exatamente o problema que a arquitetura de boot foi criada para evitar.
