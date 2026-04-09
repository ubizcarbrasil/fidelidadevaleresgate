
Objetivo: fazer o “painel da cidade” aberto pelo empreendedor mostrar somente dados da cidade escolhida, sem misturar informações da marca ou de outras cidades.

Diagnóstico
- O problema principal está em `src/pages/Dashboard.tsx`.
- Hoje, quando existe `?branchId=...`, o sistema renderiza `BranchDashboardSection`, mas continua renderizando também os blocos do dashboard da marca:
  - `DashboardKpiSection`
  - `RidesCounterCard`
  - `DashboardChartsSection`
  - tarefas/feed
  - banners e atalhos
- Isso explica exatamente os prints: a seção da cidade aparece junto com dados gerais da marca.
- Há um segundo problema em `src/components/dashboard/BranchDashboardSection.tsx`: ele usa `useBranchScoringModel()` sem receber a cidade visualizada. Para empreendedor, esse hook usa `currentBranchId` do usuário e pode cair em contexto errado/fallback.

Plano de correção
1. Criar um “modo cidade” real no dashboard
- Em `src/pages/Dashboard.tsx`, derivar um estado único como:
  - `effectiveBranchId`
  - `isCityScopedView = consoleScope === "BRANCH" || !!viewingBranchId`
- Quando `isCityScopedView` for verdadeiro:
  - renderizar somente o conteúdo da cidade
  - esconder todos os blocos agregados da marca/plataforma

2. Parar de exibir blocos agregados no acesso por cidade
- Em `Dashboard.tsx`, mover para condição de marca apenas:
  - `DashboardKpiSection`
  - `RidesCounterCard`
  - `DashboardChartsSection`
  - `DashboardTasksSection`
  - `DashboardActivityFeed`
  - banners CRM/Gamificação
  - `DashboardQuickLinksSection`
  - FAB do app
- Em modo cidade, a tela deve ficar restrita ao `BranchDashboardSection`.

3. Corrigir contexto da cidade dentro do dashboard regional
- Alterar `src/hooks/useBranchScoringModel.ts` para aceitar `branchId` opcional.
- Em `src/components/dashboard/BranchDashboardSection.tsx`, passar o `branchId` recebido por prop para o hook.
- Assim, o dashboard regional sempre usa a configuração da cidade aberta, não a cidade do papel do usuário.

4. Ajustar cabeçalho para refletir a cidade aberta
- Em `Dashboard.tsx`, quando estiver em modo cidade, trocar o subtítulo de “Visão geral da marca” para “Visão geral da cidade”.
- Se necessário, buscar nome da cidade pelo `branchId` para deixar claro qual cidade está sendo visualizada.

5. Auditar entradas relacionadas ao acesso da cidade
- Revisar `src/components/dashboard/DemoAccessCard.tsx` apenas para garantir que continua abrindo o dashboard com `branchId`.
- Verificar se nenhum componente do dashboard em modo cidade mantém seletor “Todas as cidades” ou qualquer fallback de marca visível.

Arquivos principais
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/BranchDashboardSection.tsx`
- `src/hooks/useBranchScoringModel.ts`
- `src/components/dashboard/DemoAccessCard.tsx` (auditoria final)

Resultado esperado
- Empreendedor clica para abrir uma cidade.
- O painel passa a mostrar somente KPIs, ranking, feed, arena e dados daquela cidade.
- Nenhum card, gráfico, feed ou contador agregado de outras cidades continua aparecendo.
- O comportamento fica alinhado ao isolamento visual e operacional que você pediu.

Detalhes técnicos
- Não precisa mudar banco nem permissões para este ajuste específico.
- O problema é de composição da tela e de contexto errado no hook da cidade.
- A correção será no frontend, centralizando o branch selecionado como contexto único do dashboard regional.

Validação após implementar
- Abrir cidade A pelo painel do empreendedor e confirmar que não aparecem totais da marca.
- Conferir que ranking, feed, pontuações, corridas e arena exibem somente dados da cidade A.
- Abrir cidade B e confirmar que os números mudam para os dados dela, sem mistura.
- Testar em mobile, já que os prints mostram esse fluxo no celular.
