# Plano de otimização de performance

Vou atacar a lentidão em duas frentes: remover esperas globais desnecessárias no boot/navegação e reduzir consultas pesadas que rodam em quase toda abertura de tela.

## O que está pesando hoje

1. O app fica preso no loader global enquanto valida sessão e carrega configurações da marca.
2. O layout administrativo dispara várias consultas logo ao abrir qualquer rota:
   - tema da plataforma
   - dados da marca
   - labels do menu
   - módulos resolvidos
   - scoring models
   - escopo do produto
   - badges do sidebar
3. O sidebar/admin shell depende de hooks caros para decidir o que mostrar antes da tela principal aparecer.
4. Algumas páginas, principalmente Motoristas, fazem enriquecimento com múltiplas consultas e RPCs por abertura.
5. Ainda existem trechos usando o guard antigo de módulos, o que pode forçar consultas extras e loaders desnecessários em navegações internas.

## O que vou implementar

### 1. Enxugar o boot global
- Parar de bloquear a renderização principal por dados não críticos do layout.
- Manter o acesso rápido ao shell e carregar em background o que for secundário.
- Ajustar o uso de `TelaCarregamento` para que loaders de rota não pareçam “travamento do app”.

### 2. Reduzir queries globais do AppLayout e sidebars
- Reaproveitar mais dados já presentes no contexto da marca.
- Tirar consultas que podem ser lazy/deferred após a primeira pintura.
- Evitar que cada abertura de página refaça checagens de menu, badges e configuração que não mudam com frequência.

### 3. Unificar a resolução de módulos
- Migrar guards e sidebars para o caminho já otimizado com `useResolvedModules`.
- Eliminar dependências do hook legado `useBrandModules` onde ele ainda força leitura extra.
- Aplicar cache mais agressivo e reduzir invalidações desnecessárias.

### 4. Otimizar páginas mais pesadas
- Revisar a tela de Motoristas para reduzir o custo da listagem inicial e do enriquecimento.
- Adiar consultas secundárias até a tela já estar visível.
- Revisar dashboard e blocos auxiliares para evitar que várias queries pequenas disputem o carregamento inicial.

### 5. Limpeza de UX e markup que hoje geram ruído
- Corrigir os dialogs sem título/descrição obrigatórios.
- Corrigir o breadcrumb com `li` aninhado incorretamente.
- Isso não é o principal gargalo, mas reduz warnings e renderizações desnecessárias.

## Resultado esperado

- Abertura inicial bem mais rápida, sem ficar vários segundos em “Sessão validada. Carregando configurações…”.
- Troca entre telas administrativas mais fluida.
- Menos sensação de travamento ao abrir módulos como Motoristas, Configurações e telas do dashboard.
- Menor carga no backend e menos requests repetidos no início de cada navegação.

## Detalhes técnicos

- Arquivos principais a revisar:
  - `src/App.tsx`
  - `src/components/AppLayout.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/contexts/BrandContext.tsx`
  - `src/components/consoles/BrandSidebar.tsx`
  - `src/components/consoles/BranchSidebar.tsx`
  - `src/components/ModuleGuard.tsx`
  - `src/compartilhados/hooks/hook_modulos_resolvidos.ts`
  - `src/features/gestao_motoristas/hooks/hook_listagem_motoristas.ts`
  - `src/pages/Dashboard.tsx`
- Estratégias:
  - reduzir bloqueios no boot
  - adiar queries não críticas para depois da primeira pintura
  - consolidar hooks globais repetidos
  - substituir fluxo legado de módulos pelo fluxo resolvido em RPC
  - usar cache/staleTime mais longo para dados administrativos estáveis
  - trocar loaders full-screen por loaders inline quando for navegação interna

Se você aprovar, eu implemento essa rodada de otimização agora, começando pelo boot/layout global e depois pelas páginas mais pesadas.