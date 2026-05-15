## Objetivo

Quando o motorista entrar no painel e o **único** módulo ativo da marca/cidade for o **Campeonato** (sem Resgate na Cidade, Comprar Pontos, Meus Resgates, Achadinhos), pular o hub `ACHADINHOS` e abrir direto a página do Campeonato.

Quando houver outros módulos ativos além do Campeonato, manter o hub atual exatamente como está.

## Onde mexer

Apenas em `src/pages/DriverPanelPage.tsx` (componente `DriverGate`). Nenhuma mudança em business logic, schema, ou na página do Campeonato.

### Passos

1. Em `DriverGate`, importar e usar:
   - `useDueloCampeonatoHabilitado(brand.id)` → `campeonatoHabilitado`
   - `useCampeonatoStandalone(brand.id)` → `standalone` (`campeonatoStandalone`)
   
   Hoje esses hooks só são chamados dentro de `DriverHomePage`; precisamos do valor no nível do gate para decidir o redirect.

2. Calcular flags consolidadas (já existem variáveis equivalentes no arquivo):
   ```ts
   const isCityRedemptionEnabled = (effectiveBranch as any)?.is_city_redemption_enabled === true;
   const hasOtherModules =
     achadinhosEnabled ||
     marketplaceEnabled ||
     buyPointsEnabled ||
     isCityRedemptionEnabled;
   const showCampeonato = campeonatoHabilitado || campeonatoStandalone;
   const campeonatoOnly = showCampeonato && !hasOtherModules;
   ```

3. Adicionar `useEffect` que dispara o redirect quando:
   - `driver` autenticado
   - `modulesLoaded === true` (evita redirecionar antes de saber os flags reais)
   - `loadingFlag` dos hooks de Campeonato finalizado
   - `campeonatoOnly === true`
   - rota atual ainda é `/painel-motorista` (não está num overlay/categoria)

   Ação: `navigate(`/motorista/campeonato?brandId=...&sessionKey=...`, { replace: true })` reaproveitando a mesma montagem de query string que o `onOpenCampeonato` já usa (linhas 165–172).

4. Enquanto o redirect ainda não disparou (mas já sabemos que `campeonatoOnly === true`), renderizar o mesmo loader (`Loader2`) usado nas linhas 134–140 para evitar o flash do hub `ACHADINHOS`.

5. Não alterar o caminho contrário: se `hasOtherModules` for verdadeiro, o `DriverHomePage` continua sendo renderizado normalmente (incluindo o card "Campeonato" dentro do hub).

## Critérios de aceite

- Marca com **só Campeonato ativo** → ao entrar em `/painel-motorista`, motorista cai direto na página do Campeonato sem ver o hub.
- Marca com Campeonato + qualquer outro módulo (Resgate na Cidade, Comprar Pontos, Achadinhos, Marketplace) → hub `ACHADINHOS` continua aparecendo igual hoje, com o card Campeonato listado.
- Sem regressão em deep links (`?campeonato=1`, `initialCategoryId`, `initialDealId`) — o `useEffect` novo só age quando nenhum desses está em jogo (já coberto por `modulesLoaded` + `!hasOtherModules`).
- Sem flash visual do hub durante a decisão (loader cobre o intervalo).
