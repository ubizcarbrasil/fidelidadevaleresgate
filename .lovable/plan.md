

# Modo "Apenas Campeonato" para a marca Meu Mototáxi

## Diagnóstico — por que ainda aparece Duelos/Apostas/Ranking/Cinturão

A última correção arrumou só a **Camada 2** (registro em `brand_business_models`), mas a tela de Gamificação **ignora completamente** o `engagement_format`. A `GamificacaoAdminPage` renderiza **fixamente** 7 abas (Configuração, Duelos, Apostas, Campeonato, Ranking, Cinturão, Moderação) e a "Configuração do Módulo" mostra **todos os toggles** (Duelos DvD, Patrocinados, Apostas paralelas, Ranking, Cinturão…) — independente do formato escolhido.

E na cidade Ipatinga - MG, as flags `enable_city_ranking` e `enable_city_belt` ainda estão `true`, então no app do motorista também aparecem Ranking e Cinturão.

## O que vou fazer

### 1) Filtrar abas da Gamificação pelo formato de engajamento

Em `src/pages/GamificacaoAdminPage.tsx`:
- Ler `useFormatoEngajamento(brand.brand_id)`.
- Quando `engagement_format === 'campeonato'`:
  - Mostrar **apenas 3 abas**: `Configuração` (modo enxuto), `Campeonato`, `Moderação`.
  - **Esconder**: `Duelos`, `Apostas`, `Ranking`, `Cinturão`.
- `defaultValue` passa para `"campeonato"` quando o formato é campeonato (cai direto na tela útil).

### 2) Modo "Apenas Campeonato" na Configuração do Módulo

Em `src/components/admin/gamificacao/ConfiguracaoModulo.tsx`:
- Receber `engagementFormat` como prop.
- Quando `'campeonato'`:
  - Esconder toggles: Duelos DvD, Duelos Patrocinados, Apostas paralelas, Visualização pública, Palpites, Avaliações pós-duelo, Modo de adesão, Durações, Métricas de ranking/cinturão.
  - Mostrar **apenas**: aviso destacado *"Esta marca opera no formato Campeonato. Configurações de duelos, apostas, ranking e cinturão estão desativadas e ocultas."* + link para a aba Campeonato.
- Idem para sub-abas Limites / Ciclo & Reset / Prêmios / Corridas em `pagina_configuracoes_duelo.tsx`: ocultas no formato campeonato.

### 3) Esconder Ranking e Cinturão no app do motorista

No app do motorista (`SecaoGamificacaoDashboard`, `DriverMarketplace`), a visibilidade de Ranking, Cinturão e Duelos já é gated por `branch_settings_json` (`enable_city_ranking`, `enable_city_belt`, `duelosAtivos`).

Vou:
- Adicionar uma checagem do **engagement_format da marca** no resolver `useGamificacaoConfig` (ou equivalente). Se `'campeonato'` → forçar `duelosAtivos=false`, `rankingAtivo=false`, `cinturaoAtivo=false` independente do que está no `branch_settings_json`. Os toggles do empreendedor não afetam mais essa marca — o formato manda.
- Adicionar uma seção "Campeonato Motorista" no Driver Hub que aparece **somente** quando o formato é campeonato (link pra tela já existente do campeonato motorista).

### 4) Migration de limpeza de dados (defensivo)

Migration que, **só para a marca Meu Mototáxi**, faz `UPDATE branches SET branch_settings_json = settings || jsonb_build_object('enable_city_ranking', false, 'enable_city_belt', false, 'enable_driver_duels', false, 'enable_duel_driver_vs_driver', false, 'enable_duel_sponsored_by_brand', false, 'enable_duel_side_bets', false, 'enable_duel_guesses', false)` em **todas** as branches. Mesmo que a UI ignore, mantém o estado consistente.

## Resultado esperado

**Painel do empreendedor** → Gamificação → Ipatinga:
- Só aparecem 3 abas: **Configuração** (vazia, com aviso), **🏆 Campeonato**, **Moderação**.
- A aba Campeonato abre direto no fluxo de criação de temporada.

**App do motorista (Meu Mototáxi)**:
- **Não aparece** card de Duelos, Ranking ou Cinturão.
- **Aparece** apenas a seção "Campeonato Motorista" com séries/posição/prêmios.

**Outras marcas**: nada muda — continuam vendo todas as abas e todos os toggles.

## Arquivos a editar

**Frontend (5 arquivos):**
- `src/pages/GamificacaoAdminPage.tsx` — esconder abas conforme formato
- `src/components/admin/gamificacao/ConfiguracaoModulo.tsx` — modo enxuto quando campeonato
- `src/features/duelo_configuracoes/pagina_configuracoes_duelo.tsx` — esconder sub-abas
- `src/components/driver/duels/dashboard/SecaoGamificacaoDashboard.tsx` — gating por formato
- Hook de configuração de gamificação do motorista (provavelmente `useGamificacaoConfig` ou equivalente) — incluir `engagement_format` no retorno

**Backend (1 migration):**
- Limpeza idempotente das flags de duelo/ranking/cinturão nas branches da marca Meu Mototáxi.

## Risco e rollback

- **Risco baixo**: tudo é gated por `engagement_format === 'campeonato'`. Marcas em `'duelo'` ou `'mass_duel'` não veem diferença.
- **Rollback trivial**: reverter os 5 arquivos e a migration restaura a UI completa.

