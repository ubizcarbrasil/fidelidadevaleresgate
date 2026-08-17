# 00-ARQUITETURA.md — Arquitetura completa do sistema

> Documentacao gerada a partir do codigo e do banco reais. Nenhum arquivo de
> aplicacao foi alterado para produzir estes documentos.
>
> Documentos irmaos: `01-BANCO.sql` (schema completo), `02-EDGE-FUNCTIONS.md`
> (backend serverless), `03-CONFIGURACAO.md` (build, env, segredos),
> `04-ROTAS.md` (mapa de rotas).

## 1. O que este sistema e

Plataforma SaaS **white-label de fidelidade, pontos e resgate** ("Vale Resgate"),
com quatro produtos convivendo no mesmo codigo:

1. **Fidelidade / Loyalty** — acumulo e resgate de pontos em lojas parceiras
   (emissoras, receptoras e mistas), cupons, vouchers e PDV.
2. **Mobilidade** — integracao com a TaxiMachine: corridas geram pontos para
   motoristas e passageiros; carteira pre-paga por cidade.
3. **Gamificacao** — Campeonato, duelos, rankings, cinturao da cidade, apostas
   em pontos, premios e temporadas.
4. **Achadinhos / Ofertas de afiliados** — catalogo espelhado de ofertas
   externas, com resgate por pontos e paginas publicas.

## 2. Hierarquia de dominio (multi-tenant)

```text
Root Admin (plataforma)
  └── Tenant (Empresa)          tabela: tenants
        └── Brand (Marca)        tabela: brands      -> dominio white-label proprio
              └── Branch (Cidade)  tabela: branches  -> carteira de pontos, modulos e temas proprios
                    └── Store (Parceiro) tabela: stores -> emissora / receptora / mista
                          └── Clientes e Motoristas  tabelas: customers, driver_profiles
```

- Papeis (enum `app_role`): `root_admin`, `tenant_admin`, `brand_admin`,
  `branch_admin`, `branch_operator`, `operator_pdv`, `store_admin`, `customer`.
- Papeis vivem **sempre** em `user_roles` (nunca no perfil) e sao checados por
  funcao `SECURITY DEFINER` (`has_role`) dentro das policies de RLS.
- Motoristas sao clientes marcados com `[MOTORISTA]` no nome e possuem sessao
  propria por CPF (`driver-cpf-login`), fora do `auth.users`.

## 3. Camadas da aplicacao

```text
index.html
  └── src/entry-client.ts        marca a fase de boot e importa main.tsx
        └── src/main.tsx         BootShell, recuperacao de PWA, providers globais
              └── src/App.tsx    decide a arvore de rotas (portal / white-label / publico / fast-track)
                    ├── src/routes/AnimatedRoutes.tsx   painel administrativo (rotas protegidas)
                    ├── src/components/WhiteLabelLayout.tsx  app do cliente final
                    └── src/pages/DriverPanelPage.tsx   PWA do motorista (fast-track)
```

Fluxo de dados padrao:

```text
pagina (feature)  ->  hook (React Query)  ->  service  ->  supabase client / edge function  ->  Postgres (RLS)
```

Regras estruturais em vigor:

- **Feature-based**: cada funcionalidade nova vive em `src/features/<nome>/`
  com `pagina_*.tsx`, `components/`, `hooks/`, `services/`, `types/`,
  `schemas/`, `constants/`, `utils/`. Codigo reutilizavel em
  `src/compartilhados/`. Componentes base shadcn em `src/components/ui/`.
- Nomes de arquivos em `snake_case` e portugues nas features novas; ha um
  legado em `PascalCase` sob `src/pages/` e `src/components/`.
- Nenhuma chamada de API dentro de componente visual: sempre via `services/`.
- `points_ledger` e a fonte da verdade de pontos; movimentacoes usam RPCs com
  `FOR UPDATE`.
- Todo `update` no Supabase usa `.select()` para detectar falha silenciosa de RLS.
- Flags de cidade em `branch_settings_json` sao lidas com `=== true`
  (ausente = desligado).

## 4. Contextos globais (estado de aplicacao)

| Contexto | Responsabilidade |
|---|---|
| `src/contexts/AuthContext.tsx` | sessao, papeis (`user_roles`), expiracao e refresh |
| `src/contexts/brand/*` | resolucao da marca (dominio/param), dados da marca e tema |
| `src/contexts/CustomerContext.tsx` | identidade do cliente final no app white-label |
| `src/contexts/DriverSessionContext.tsx` | sessao do motorista por CPF e impersonacao |

## 5. Guardas de acesso no frontend

- `ProtectedRoute` — exige sessao autenticada.
- `RootGuard` — restringe a `root_admin`.
- `ModuleGuard moduleKey="x"` — exige modulo habilitado para a marca/cidade
  (`brand_modules`, `city_module_overrides`, `module_definitions`); `"a|b"` = OR.
- Permissoes granulares hierarquicas: `permissions`, `permission_groups`,
  `role_permissions`, `user_permission_overrides`, `brand_permission_config`.

> O frontend guarda a **experiencia**; a autorizacao real e sempre RLS no banco
> + validacao nas edge functions.

## 6. Backend

- **Banco Postgres** com RLS em todas as tabelas de negocio, ~150 tabelas,
  centenas de funcoes/RPCs e triggers. Ver `01-BANCO.sql`.
- **Edge Functions** (Deno) para webhooks, integracoes, IA, cobranca, importacoes
  e rotinas de cron. Ver `02-EDGE-FUNCTIONS.md`.
- **pg_cron + pg_net** disparam as functions agendadas usando a ANON KEY.
- **Storage** para avatares, planilhas de importacao e imagens de produtos.

## 7. Arvore de arquivos comentada

Uma linha por arquivo. As descricoes vem do comentario de cabecalho do proprio
arquivo quando existe; caso contrario, dos simbolos exportados.


### Frontend — `src/`

```text

src/
  App.css                                               rebuild
  App.tsx                                               rebuild-trigger v2026-04-02a
  entry-client.ts                                       Entry client — Vite uses this as the static entry point. Marks boot phase then imports main.tsx.
  index.css                                             modulo TypeScript
  main.tsx                                              Entry point — mounts a minimal shell instantly, then lazy-loads App. Sentry and web-vitals are deferred to avoid blocking the first render.
  vite-env.d.ts                                         / <reference types="vite/client" />

src/__tests__/audit/
  brandUtils.test.ts                                    suite de testes
  categoryMatcher.test.ts                               suite de testes
  dateTz.test.ts                                        suite de testes
  mirrorSyncHelpers.test.ts                             suite de testes
  otpHelpers.test.ts                                    suite de testes
  sendEmail.test.ts                                     `_shared/email.ts` sendEmail — wrapper Resend usado por: - otpHelpers.sendOtpEmail (auth) - trial-reminders-cron (subscription growth) - futuros transactional emails Bug aqui = emails de OTP não saem (login motorista que

src/assets/
  banner-vitrine-teste.jpg                              modulo TypeScript
  logo-pizzaria-do-joao.png                             modulo TypeScript

src/compartilhados/components/
  badge_duplicado.tsx                                   Badge visual "DUPLICADO" exibido ao lado de itens de menu que aparecem em mais de um lugar dos consoles. É puramente informativo — clicar nele não remove nada. Visível apenas para Root Admin (controle no chamador).
  botao_atualizar_app.tsx                               componente React — exporta: BotaoAtualizarApp
  input_numero.tsx                                      componente React — exporta: InputNumero
  manual_modal.tsx                                      componente React — exporta: ManualModal
  paginacao_tabela.tsx                                  componente React — exporta: PaginacaoTabela
  tela_carregamento.tsx                                 componente React — exporta: TelaCarregamento, TelaCarregamentoInline

src/compartilhados/constants/
  constantes_categorias_modulos.ts                      Metadados das 8 categorias de módulos da plataforma. Fonte única — usado por BrandModulesPage, Central de Módulos, etc.
  constantes_features.ts                                Feature flags em código (sem variáveis de ambiente). Para reverter um comportamento experimental, basta trocar o valor para `false` e fazer um novo deploy. Mantém a opção de rollback rápido sem migration nem secrets.
  constantes_grupos_sidebar_marca.ts                    modulo TypeScript — exporta: brandGroupDefs
  constantes_menu_sidebar.ts                            modulo TypeScript — exporta: RegistroItemMenu, MENU_REGISTRY, DefinicaoItemGrupo, DefinicaoGrupoSidebar, buildSidebarGroups

src/compartilhados/hooks/
  hook_branches_sync.ts                                 hook_branches_sync.ts Estado global centralizado para invalidação de cache de cidades (branches). Sempre que uma cidade for criada, atualizada, ativada/desativada ou removida, este hook deve ser usado para garantir que T
  hook_brand_business_models.ts                         hook_brand_business_models — Sub-fase 5.5 ------------------------------------------ CRUD do empreendedor sobre seus Modelos de Negócio: - useBrandBusinessModels(brandId): lista de vínculos da brand - useToggleBrandBusin
  hook_brand_feature.ts                                 hook_brand_feature — Sprint 3 + Sprint 4B Hooks para leitura/escrita de features consolidadas no Duelo Motorista. Features cobertas: 'duelo' | 'cinturao' | 'aposta' | 'ranking' Defaults documentados (semântica das RPCs S
  hook_brand_plan_business_models.ts                    hook_brand_plan_business_models — Sub-fase 5.5 ----------------------------------------------- Combinador que retorna, para uma brand+plano: - all: todos os 13 modelos do catálogo (ativos) - availableKeys: chaves liberad
  hook_business_model_addons.ts                         hook_business_model_addons — Sub-fase 6.1 ------------------------------------------ CRUD da camada de Add-ons avulsos (Modelos de Negócio vendidos individualmente). - list_business_model_addons (RPC) — lista enriquecida
  hook_business_models_ui_flag.ts                       hook_business_models_ui_flag — Sub-fase 5.5 -------------------------------------------- Decide se a brand deve ver a UI nova de "Modelos de Negócio". Regra: ativa se OU - flag global `USE_BUSINESS_MODELS` = true (rollou
  hook_city_business_model_overrides.ts                 hook_city_business_model_overrides — Sub-fase 5.6 -------------------------------------------------- CRUD sobre `city_business_model_overrides` (overrides por cidade). - useCityBusinessModelOverrides(brandId, branchId) →
  hook_duplicacoes_menu.ts                              Hook que constrói o inventário de itens dos 3 sidebars (Root, Brand, Branch) a partir das definições reais usadas em cada console e devolve o conjunto de chaves duplicadas + relatório completo. IMPORTANTE: as definições 
  hook_formatos_permitidos.ts                           modulo TypeScript — exporta: FormatoEngajamentoChave, useFormatosPermitidos, useDefinirFormatosPermitidos
  hook_ganha_ganha_pricing.ts                           hook_ganha_ganha_pricing — Sub-fase 5.4 ---------------------------------------- Pricing histórico versionado do Ganha-Ganha (Opção B): - useGanhaGanhaPricing: linhas ATIVAS (valid_to IS NULL) por plano - useUpdateGanhaG
  hook_modelos_negocio_crud.ts                          hook_modelos_negocio_crud — Sub-fase 5.3 ---------------------------------------- Hooks CRUD da camada de Modelos de Negócio (UI Raiz). - Catálogo de business_models (SELECT + UPDATE + INSERT + soft-delete) - Vínculos N-
  hook_modelos_negocio_resolvidos.ts                    useResolvedBusinessModels — Sub-fase 5.2 ---------------------------------------- Hook unificado de resolução de Modelos de Negócio via RPC `resolve_active_business_models`. - Cascata server-side: cidade > marca > inativ
  hook_modulos_resolvidos.ts                            useResolvedModules — Fase 4.3a ------------------------------ Hook unificado de resolução de módulos via RPC `resolve_active_modules`. - Cascata server-side: cidade > marca > is_core > inativo - Subscribe Realtime em 3 t
  hook_paginacao.ts                                     modulo TypeScript — exporta: useHookPaginacao
  hook_plan_business_models.ts                          hook_plan_business_models — Sub-fase 5.3 ---------------------------------------- Matriz Modelos × Planos (plan_business_models). Ações: - Listar matriz (Map<"planKey::modelId", { is_included }>) - Toggle individual (UPS
  hook_regras_resgate_cidade.ts                         modulo TypeScript — exporta: RegrasResgateEfetivas, useRegrasResgateCidade, REGRAS_RESGATE_PADRAO
  hook_relatorios_ganha_ganha.ts                        hook_relatorios_ganha_ganha — Sub-fase 5.8 ------------------------------------------ Hooks que consomem as 4 RPCs SECURITY DEFINER de relatórios Cashback. - rpc_gg_report_summary - rpc_gg_report_by_store - rpc_gg_report

src/compartilhados/hooks/__tests__/
  hook_branches_sync.test.tsx                           hook_branches_sync — sincronização centralizada de cache de cidades. Bug aqui = cidade nova/editada/removida não aparece em outras telas (cache stale → admin pensa que mudança não salvou).
  hook_brand_business_models.test.tsx                   hook_brand_business_models — CRUD do empreendedor sobre seus Modelos de Negócio. Bug aqui = modelo ativado/desativado não reflete, ou margem GG salva no row errado (cobrança quebrada).
  hook_brand_feature.test.tsx                           hook_brand_feature — features Duelo Motorista (cinturão, aposta, ranking, duelo). Bug aqui: - Admin desliga feature mas UI continua mostrando (cache stale) - Apostas deixadas ativas após desligar duelo (regra D9 violada)
  hook_brand_plan_business_models.test.tsx              hook_brand_plan_business_models — combina 5 queries pra resolver estado de cada Business Model (active/available_inactive/locked) por brand+plano + add-ons. Bug aqui = UI mostra módulo como "active" mas usuário não conse
  hook_business_model_addons.test.tsx                   hook_business_model_addons — CRUD de Add-ons avulsos (Modelos de Negócio vendidos individualmente). Bug aqui = add-on concedido vira UPSERT errado (perde brand_id ou branch_id), cancel não fecha expires_at, ou invalidaçã
  hook_business_models_ui_flag.test.tsx                 hook_business_models_ui_flag — flag de rollout gradual da UI de Modelos de Negócio. Bug aqui: - Brand sem opt-in beta enxerga UI nova (rollout descontrolado) - USE_BUSINESS_MODELS global ignorado (rollout total bloqueado
  hook_city_business_model_overrides.test.tsx           hook_city_business_model_overrides — CRUD de overrides por cidade sobre Business Models. Bug aqui = cidade não consegue ligar/desligar modelo (UX quebrada), "voltar ao herdado" não funciona (delete preso), clear-all não 
  hook_duplicacoes_menu.test.tsx                        hook_duplicacoes_menu — orquestra a auditoria de duplicações dos 3 sidebars (Root, Brand, Branch). Bug aqui = badge "duplicado" não aparece em itens reais OU aparece em itens que são compartilhados por design (entre cons
  hook_formatos_permitidos.test.tsx                     hook_formatos_permitidos — formatos de engajamento liberados por brand. Bug aqui: - Formato desconhecido vaza pra UI (botão aparece, falha ao usar) - Default sem registro: deveria ser todos liberados (3) — bug = vazio (z
  hook_ganha_ganha_pricing.test.tsx                     hook_ganha_ganha_pricing — pricing versionado do Ganha-Ganha (Opção B: histórico via valid_to NULL = ativo). Bug aqui = pricing errado (cobrança incorreta), histórico quebrado (impossível reconciliar mudanças), brands co
  hook_modelos_negocio_crud.test.tsx                    hook_modelos_negocio_crud — CRUD do catálogo de business_models + vínculos N-N com módulos técnicos. Bug aqui = modelo criado sem audience válido (orphan), vínculo módulo-modelo perdido (UI sem badges), ou ordenação erra
  hook_modelos_negocio_resolvidos.test.tsx              hook_modelos_negocio_resolvidos — resolução de Business Models via RPC resolve_active_business_models. Mesmo padrão de hook_modulos_resolvidos mas pra Business Models (sub-fase 5.2 do roadmap). Bug aqui = modelo de negóc
  hook_modulos_resolvidos.test.tsx                      hook_modulos_resolvidos — resolução de módulos ativos por cascata (cidade > marca > is_core). Bug aqui = módulo desabilitado aparece na sidebar (item morto) OU módulo habilitado some (UX quebrada).
  hook_paginacao.test.ts                                suite de testes
  hook_plan_business_models.test.tsx                    hook_plan_business_models — matriz Plano × Modelo de Negócio. Bug aqui = cliente assina plano X mas vê módulo do plano Y, ou vice-versa (cobrança/feature mismatch). Audit trail falhando deixa lacuna em forensics.
  hook_regras_resgate_cidade.test.tsx                   hook_regras_resgate_cidade — hierarquia de regras de resgate. Bug aqui = cliente ganha desconto errado (points_per_real divergente do que admin configurou na cidade). Hierarquia: cidade > marca > padrão.
  hook_relatorios_ganha_ganha.test.tsx                  hook_relatorios_ganha_ganha — 4 RPCs SECURITY DEFINER de cashback. Bug aqui = relatório de receita errado (cobrança incorreta), valores NaN por coerção falha, ou filtros não aplicados pro RPC (admin vê dados de outra cid

src/compartilhados/utils/
  utilitarios_duplicacao_menu.ts                        Auditoria de duplicações nos menus dos 3 consoles (Root, Brand, Branch). Estratégia (Opção A + B do plano aprovado): - A) Mesma rota base aparecendo em mais de um console/grupo → "rota_exata" - B) Mesma `moduleKey` reuti

src/compartilhados/utils/__tests__/
  utilitarios_duplicacao_menu.test.ts                   utilitarios_duplicacao_menu — detecção de itens de menu duplicados entre/dentro de consoles. Bug aqui = falsos positivos no badge "duplicado" OU duplicações reais não detectadas (UI confusa).

src/components/
  ApiKeyOnboardingDialog.tsx                            componente React — exporta: ApiKeyOnboardingDialog
  AppLayout.tsx                                         componente React — exporta: AppLayout
  BadgeConfigEditor.tsx                                 componente React — exporta: BadgeConfigEditor
  BranchSelector.tsx                                    componente React — exporta: BranchSelector
  BrandSectionsManager.tsx                              componente React — exporta: BrandSectionsManager
  BrandThemeEditor.tsx                                  componente React — exporta: BrandThemeEditor
  BrandThemePreview.tsx                                 componente React — exporta: BrandThemePreview
  ChangePasswordDialog.tsx                              componente React — exporta: ChangePasswordDialog
  CommandPalette.tsx                                    componente React — exporta: CommandPalette
  ContextBadge.tsx                                      componente React — exporta: ContextBadge
  ContextualHelpDrawer.tsx                              componente React — exporta: ContextualHelpDrawer
  CustomerLedgerDrawer.tsx                              componente React — exporta: CustomerLedgerDrawer
  DataSkeleton.tsx                                      DataSkeleton — componente reutilizável para loading states consistentes.
  DataTableControls.tsx                                 componente React — exporta: DataTableControls
  DemoStoresToggle.tsx                                  componente React — exporta: DemoStoresToggle
  ErrorBoundary.tsx                                     componente React — exporta: ErrorBoundary
  HomeSectionsRenderer.tsx                              componente React — exporta: HomeSectionsRenderer
  HomeTemplateEditor.tsx                                componente React — exporta: HomeTemplateEditor
  HomeTemplateMobilePreview.tsx                         componente React — exporta: HomeTemplateMobilePreview
  IconPickerDialog.tsx                                  componente React — exporta: IconPickerDialog
  ImageAiActions.tsx                                    componente React — exporta: ImageAiActions
  ImageCropDialog.tsx                                   componente React — exporta: ImageCropDialog
  ImageUploadField.tsx                                  componente React — exporta: ImageUploadField
  ModuleGuard.tsx                                       componente React — exporta: ModuleGuard
  MountSignal.tsx                                       componente React — exporta: MountSignal
  NavLink.tsx                                           componente React
  OfferCardConfigSection.tsx                            componente React — exporta: OfferCardConfigSection
  PageHeader.tsx                                        componente React — exporta: PageHeader
  PlatformLogo.tsx                                      componente React — exporta: PlatformLogo
  ProtectedRoute.tsx                                    componente React — exporta: ProtectedRoute
  RootGuard.tsx                                         componente React — exporta: RootGuard
  RouteErrorBoundary.tsx                                RouteErrorBoundary — boundary com reset automático em mudança de rota. Problema que resolve: - `<ErrorBoundary>` puro mantém estado `hasError` até reset explícito (botão "Voltar ao início"). - Se /customers falha em runt
  ScopeSwitcher.tsx                                     componente React — exporta: ScopeSwitcher
  SegmentAutocomplete.tsx                               componente React — exporta: SegmentAutocomplete
  SessionExpiredDialog.tsx                              componente React — exporta: SessionExpiredDialog
  TrialBanner.tsx                                       componente React — exporta: TrialBanner
  TrialExpiredBlocker.tsx                               componente React — exporta: TrialExpiredBlocker
  UserPermissionsDialog.tsx                             componente React — exporta: UserPermissionsDialog
  WhiteLabelLayout.tsx                                  componente React — exporta: WhiteLabelLayout

src/components/branch/
  DialogCriarFranqueado.tsx                             componente React — exporta: DialogCriarFranqueado
  DialogReprocessarPontos.tsx                           componente React — exporta: DialogReprocessarPontos
  DialogResetPontos.tsx                                 componente React — exporta: DialogResetPontos
  HistoricoResetPontos.tsx                              componente React — exporta: HistoricoResetPontos

src/components/brand-modules/
  HomeSectionOrderEditor.tsx                            componente React — exporta: HomeSectionOrderEditor
  SidebarOrderEditor.tsx                                componente React — exporta: SidebarOrderEditor

src/components/brand-theme/
  FontSelect.tsx                                        componente React — exporta: FontSelect
  LayoutDimensionsSection.tsx                           componente React — exporta: LayoutDimensionsSection

src/components/consoles/
  BranchSidebar.tsx                                     componente React — exporta: BranchSidebar
  BrandSidebar.tsx                                      componente React — exporta: BrandSidebar
  OperatorSidebar.tsx                                   componente React — exporta: OperatorSidebar
  RootSidebar.tsx                                       componente React — exporta: RootSidebar
  TenantSidebar.tsx                                     componente React — exporta: TenantSidebar

src/components/customer/
  AchadinhoCategoryGridOverlay.tsx                      componente React — exporta: AchadinhoCategoryGridOverlay
  AchadinhoCategoryPage.tsx                             componente React — exporta: AchadinhoCategoryPage
  AchadinhoDealDetail.tsx                               componente React — exporta: AchadinhoDealDetail
  AchadinhoDealsOverlay.tsx                             componente React — exporta: AchadinhoDealsOverlay
  AchadinhoSection.tsx                                  componente React — exporta: AchadinhoSection
  AppIcon.tsx                                           componente React — exporta: AppIcon
  BranchPickerSheet.tsx                                 componente React — exporta: BranchPickerSheet
  CancelRedemptionButton.tsx                            componente React — exporta: CancelRedemptionButton
  CatalogCartDrawer.tsx                                 componente React — exporta: CartItem, CatalogCartDrawer
  CategoryGridOverlay.tsx                               componente React — exporta: CategoryGridOverlay
  CategoryStoresOverlay.tsx                             componente React — exporta: CategoryStoresOverlay
  CompreComPontosSection.tsx                            componente React — exporta: CompreComPontosSection
  CustomerLayout.tsx                                    componente React — exporta: useOfferNav, useCustomerNav, CustomerLayout
  CustomerLedgerOverlay.tsx                             componente React — exporta: CustomerLedgerOverlay
  CustomerMenuDrawer.tsx                                componente React — exporta: CustomerMenuDrawer
  CustomerRedeemCheckout.tsx                            componente React — exporta: CustomerRedeemCheckout
  CustomerRedeemOrderHistory.tsx                        componente React — exporta: CustomerRedeemOrderHistory
  CustomerRedeemStorePage.tsx                           componente React — exporta: CustomerRedeemStorePage
  CustomerSearchOverlay.tsx                             componente React — exporta: CustomerSearchOverlay
  DetailInfoRow.tsx                                     componente React — exporta: DetailInfoRow
  EmissorasSection.tsx                                  componente React — exporta: EmissorasSection
  EmptyState.tsx                                        componente React — exporta: EmptyState
  ForYouSection.tsx                                     componente React — exporta: ForYouSection
  NotificationDrawer.tsx                                componente React — exporta: NotificationDrawer
  OfferBadge.tsx                                        componente React — exporta: OfferBadge
  OfferPurposeBadge.tsx                                 componente React — exporta: OfferPurposeBadge
  OperatingHoursDisplay.tsx                             componente React — exporta: OperatingHoursDisplay
  ProductOrderCard.tsx                                  componente React — exporta: ProductOrderCard
  RedemptionCard.tsx                                    componente React — exporta: RedemptionCard
  RedemptionCardSkeleton.tsx                            componente React — exporta: RedemptionCardSkeleton
  RedemptionSignupCarousel.tsx                          componente React — exporta: RedemptionSignupCarousel
  ReportarOfertaDialog.tsx                              componente React — exporta: ReportarOfertaDialog
  SafeImage.tsx                                         componente React — exporta: SafeImage
  SectionDetailOverlay.tsx                              componente React — exporta: SectionDetailOverlay
  SegmentNavSection.tsx                                 componente React — exporta: SegmentNavSection
  StoreCatalogView.tsx                                  componente React — exporta: StoreCatalogView
  StoreDetailHero.tsx                                   componente React — exporta: StoreDetailHero
  StoreDetailInfoCard.tsx                               componente React — exporta: StoreDetailInfoCard
  StoreOfferCardSkeleton.tsx                            componente React — exporta: StoreOfferCardSkeleton
  StoreOffersList.tsx                                   componente React — exporta: StoreOfferCard, StoreOffersList
  StoreReviewsSection.tsx                               componente React — exporta: StoreReviewsSection
  WelcomeTour.tsx                                       componente React — exporta: WelcomeTour

src/components/dashboard/
  AchadinhosAlerts.tsx                                  componente React — exporta: AchadinhosAlerts
  ActivityFeed.tsx                                      componente React — exporta: ActivityFeed
  AdminNotificationBell.tsx                             componente React — exporta: AdminNotificationBell
  BranchDashboardSection.tsx                            componente React — exporta: BranchDashboardSection
  DashboardChartsSection.tsx                            componente React — exporta: DashboardChartsSection
  DashboardKpiSection.tsx                               componente React — exporta: DashboardKpiSection
  DashboardQuickLinks.tsx                               componente React — exporta: DashboardQuickLinksSection
  DemoAccessCard.tsx                                    componente React — exporta: DemoAccessCard
  KpiCard.tsx                                           componente React — exporta: KpiCard
  KpiSparkline.tsx                                      Sparkline isolado em módulo separado pra permitir lazy-load.
  PendingReportsSection.tsx                             componente React — exporta: PendingReportsSection
  PointsFeed.tsx                                        componente React — exporta: PointsFeed
  RankingPontuacao.tsx                                  componente React — exporta: RankingPontuacao
  RedemptionOrderDetailDialog.tsx                       componente React — exporta: RedemptionOrderDetailDialog
  RidesCounterCard.tsx                                  componente React — exporta: RidesCounterCard
  TasksSection.tsx                                      componente React — exporta: TasksSection
  index.ts                                              modulo TypeScript

src/components/dashboard/branch/
  BranchApostasResumo.tsx                               Resumo de apostas (side bets) da cidade para o painel admin.
  BranchFeedTempoReal.tsx                               componente React — exporta: BranchFeedTempoReal
  BranchGraficoCorridasDia.tsx                          componente React — exporta: BranchGraficoCorridasDia
  BranchKpiClientesAtivos.tsx                           componente React — exporta: BranchKpiClientesAtivos
  BranchKpiClientesCadastrados.tsx                      componente React — exporta: BranchKpiClientesCadastrados
  BranchKpiCorridas.tsx                                 componente React — exporta: BranchKpiCorridas
  BranchKpiLojasParceiras.tsx                           componente React — exporta: BranchKpiLojasParceiras
  BranchKpiMediaMotorista.tsx                           componente React — exporta: BranchKpiMediaMotorista
  BranchKpiMotoristas.tsx                               componente React — exporta: BranchKpiMotoristas
  BranchKpiOfertasAtivas.tsx                            componente React — exporta: BranchKpiOfertasAtivas
  BranchKpiPontosHoje.tsx                               componente React — exporta: BranchKpiPontosHoje
  BranchKpiPontosMes.tsx                                componente React — exporta: BranchKpiPontosMes
  BranchKpiPontuacao.tsx                                componente React — exporta: BranchKpiPontuacao
  BranchKpiResgates.tsx                                 componente React — exporta: BranchKpiResgates
  BranchRankingMotoristas.tsx                           componente React — exporta: BranchRankingMotoristas
  BranchVisaoGeral.tsx                                  componente React — exporta: BranchVisaoGeral
  hook_branch_dashboard.ts                              modulo TypeScript — exporta: useBranchDashboardStats, useBranchRanking, useBranchRealtimeFeed, useBranchPassengerStats, useBranchRidesPerDay
  hook_branch_duelos.ts                                 Hook para métricas agregadas de duelos e apostas da cidade (Branch Dashboard).
  tipos_branch_dashboard.ts                             modulo TypeScript — exporta: BranchDashboardStats, RankingItem, FeedItem, BranchPassengerStats

src/components/dashboard/branch/__tests__/
  hook_branch_dashboard.test.tsx                        useBranchDashboardStats + useBranchRanking + useBranchRealtimeFeed + useBranchPassengerStats + useBranchRidesPerDay — hooks do dashboard de cidade. Bug aqui = ranking sem position vira número errado, RPC sem branchId vaz
  hook_branch_duelos.test.tsx                           useBranchDuelosStats — agrega métricas de duelos + apostas da cidade. Bug aqui = pontosEmEscrow conta apostas settled (deveria ser só matched), mês corrente errado por timezone, count null vira NaN em UI.

src/components/driver/
  CityOfferDetailOverlay.tsx                            componente React — exporta: CityOfferDetailOverlay
  DriverBannerCarousel.tsx                              componente React — exporta: DriverBannerCarousel
  DriverBuyPointsOverlay.tsx                            componente React — exporta: DriverBuyPointsOverlay
  DriverCategoryCarousel.tsx                            componente React — exporta: DriverCategoryCarousel
  DriverCategoryPage.tsx                                componente React — exporta: DriverCategoryPage
  DriverCityPartnersPage.tsx                            componente React — exporta: DriverCityPartnersPage
  DriverCityRedeemFlow.tsx                              componente React — exporta: DriverCityRedeemFlow
  DriverCityRedemptionHistory.tsx                       Histórico de resgates na cidade para o motorista. Exibe PINs ativos, usados e expirados.
  DriverCpfLogin.tsx                                    componente React — exporta: DriverCpfLogin
  DriverDealCard.tsx                                    componente React — exporta: DriverDealCard
  DriverDealCardGrid.tsx                                componente React — exporta: DriverDealCardGrid
  DriverLedgerOverlay.tsx                               componente React — exporta: DriverLedgerOverlay
  DriverMarketplace.tsx                                 eslint-disable @typescript-eslint/no-unused-vars
  DriverProfileOverlay.tsx                              componente React — exporta: DriverProfileOverlay
  DriverProgramInfo.tsx                                 componente React — exporta: DriverProgramInfo
  DriverRedeemCheckout.tsx                              componente React — exporta: DriverRedeemCheckout
  DriverRedeemOrderHistory.tsx                          componente React — exporta: DriverRedeemOrderHistory
  DriverRedeemStorePage.tsx                             componente React — exporta: DriverRedeemStorePage
  DriverVerifyCodeStep.tsx                              componente React — exporta: DriverVerifyCodeStep
  SecaoResgateCidade.tsx                                componente React — exporta: SecaoResgateCidade
  SecaoVideosInfo.tsx                                   componente React — exporta: SecaoVideosInfo

src/components/driver/home/
  ActiveCategoriesSection.tsx                           componente React — exporta: ActiveCategoriesSection
  DriverHomePage.tsx                                    componente React — exporta: DriverHomePage
  HomeHeader.tsx                                        componente React — exporta: HomeHeader
  HomeManualSection.tsx                                 componente React — exporta: HomeManualSection
  HomeSearchBar.tsx                                     componente React — exporta: HomeSearchBar
  HomeVitrine.tsx                                       componente React — exporta: HomeVitrine
  QuickActionCards.tsx                                  componente React — exporta: QuickActionCards
  UserPointsCard.tsx                                    componente React — exporta: UserPointsCard

src/components/driver-management/
  DriverBranchEditor.tsx                                componente React — exporta: DriverBranchEditor
  DriverDetailSheet.tsx                                 componente React — exporta: DriverDetailSheet
  DriverLedgerSection.tsx                               componente React — exporta: DriverLedgerSection
  DriverNotificationConfig.tsx                          componente React — exporta: DriverNotificationConfig
  DriverPasswordReset.tsx                               componente React — exporta: DriverPasswordReset
  DriverRuleEditor.tsx                                  componente React — exporta: DriverRuleEditor
  DriverScoringToggle.tsx                               componente React — exporta: DriverScoringToggle

src/components/driver-management/hooks/
  hook_perfil_motorista.ts                              modulo TypeScript — exporta: useDriverProfile

src/components/driver-management/hooks/__tests__/
  hook_perfil_motorista.test.tsx                        useDriverProfile — busca driver_profile estendido por customer_id. Bug aqui = motorista nunca importado retorna 404 em vez de null, customerId null dispara query desnecessária (rede), maybeSingle error propaga sem tratam

src/components/driver-management/tabs/
  AbaDadosMotorista.tsx                                 componente React — exporta: AbaDadosMotorista
  AbaDocumentacaoMotorista.tsx                          componente React — exporta: AbaDocumentacaoMotorista
  AbaExtratoMotorista.tsx                               componente React — exporta: AbaExtratoMotorista
  AbaPontuacaoMotorista.tsx                             componente React — exporta: AbaPontuacaoMotorista
  AbaRegrasMotorista.tsx                                componente React — exporta: AbaRegrasMotorista
  AbaVeiculosMotorista.tsx                              componente React — exporta: AbaVeiculosMotorista

src/components/driver-management/tabs/componentes/
  CardFichaMotorista.tsx                                componente React — exporta: CardFichaMotorista
  LinhaInfo.tsx                                         componente React — exporta: LinhaInfo

src/components/driver-management/utils/
  formatadores_motorista.ts                             Formatadores específicos da ficha do motorista. Mantido neste arquivo por ter constantes/rótulos extras (ROTULOS_PAGAMENTOS, etc) que só fazem sentido neste contexto. Funções genéricas (CPF, phone, BRL) vivem em @/lib/fo

src/components/driver-management/utils/__tests__/
  formatadores_motorista.test.ts                        formatadores_motorista — formatters da ficha do motorista (texto, número, boolean, CPF, data, placa, CNH vencida, rótulos de pagamento/serviço). Bug aqui = data inválida vira "Invalid Date" no UI, boolean null fica em br

src/components/landing/
  LandingAppPreview.tsx                                 componente React — exporta: LandingAppPreview
  LandingBenefits.tsx                                   componente React — exporta: LandingBenefits
  LandingCRM.tsx                                        componente React — exporta: LandingCRM
  LandingCommercialModel.tsx                            componente React — exporta: LandingCommercialModel
  LandingFAQ.tsx                                        componente React — exporta: LandingFAQ
  LandingFooter.tsx                                     componente React — exporta: LandingFooter
  LandingHero.tsx                                       componente React — exporta: LandingHero
  LandingHowItWorks.tsx                                 componente React — exporta: LandingHowItWorks
  LandingNextStep.tsx                                   componente React — exporta: LandingNextStep
  LandingTestimonials.tsx                               componente React — exporta: LandingTestimonials
  LandingWhiteLabel.tsx                                 componente React — exporta: LandingWhiteLabel

src/components/machine-integration/
  ManualCustomerScoringDialog.tsx                       componente React — exporta: ManualCustomerScoringDialog
  ManualDriverScoringDialog.tsx                         componente React — exporta: ManualDriverScoringDialog
  ScoredCustomersPanel.tsx                              componente React — exporta: ScoredCustomersPanel
  ScoredDriversPanel.tsx                                componente React — exporta: ScoredDriversPanel

src/components/manuais/
  ManualRenderer.tsx                                    componente React — exporta: ManualRenderer
  dados_manuais.ts                                      modulo TypeScript — exporta: gruposManuais, gruposManuaisFranqueado
  tipos_manuais.ts                                      modulo TypeScript — exporta: ManualEntry, GrupoManual

src/components/mirror-sync/
  AiBannerDialog.tsx                                    componente React — exporta: AiBannerDialog
  MirrorSyncCategoryDiag.tsx                            componente React — exporta: MirrorSyncCategoryDiag
  MirrorSyncConfig.tsx                                  componente React — exporta: MirrorSyncConfig
  MirrorSyncDealsTable.tsx                              componente React — exporta: MirrorSyncDealsTable
  MirrorSyncDebug.tsx                                   componente React — exporta: MirrorSyncDebug
  MirrorSyncKpis.tsx                                    componente React — exporta: MirrorSyncKpis
  MirrorSyncLogs.tsx                                    componente React — exporta: MirrorSyncLogs

src/components/offer-governance/
  GovernanceCleanup.tsx                                 componente React — exporta: GovernanceCleanup
  GovernanceDealsTable.tsx                              componente React — exporta: GovernanceDealsTable
  GovernanceGroupsTable.tsx                             componente React — exporta: GovernanceGroupsTable
  GovernanceKpis.tsx                                    componente React — exporta: GovernanceKpis
  GovernanceReportsTable.tsx                            componente React — exporta: GovernanceReportsTable
  GovernanceSyncLogs.tsx                                componente React — exporta: GovernanceSyncLogs

src/components/page-builder/
  ElementEditor.tsx                                     componente React — exporta: ElementEditor
  ElementRenderer.tsx                                   componente React — exporta: ElementRenderer
  InlineBannerManager.tsx                               componente React — exporta: InlineBannerManager
  LivePreview.tsx                                       componente React — exporta: LivePreview
  PagePreview.tsx                                       componente React — exporta: PagePreview
  StorageImageUpload.tsx                                componente React — exporta: StorageImageUpload
  UnifiedEditor.tsx                                     componente React — exporta: UnifiedEditor
  UnifiedPreview.tsx                                    componente React — exporta: UnifiedPreview
  types.ts                                              modulo TypeScript — exporta: PageElementStyle, PageElementAction, PageElement, DEFAULT_ELEMENT, ELEMENT_TYPE_LABELS, SectionRow

src/components/page-builder-v2/
  ManualLinksEditor.tsx                                 componente React — exporta: ManualLinksEditor
  PageRenderer.tsx                                      componente React — exporta: PageRenderer
  PageSectionsEditor.tsx                                componente React — exporta: NativeSectionConfig, PageSectionsEditor
  SectionCreatorWizard.tsx                              componente React — exporta: SectionCreatorWizard
  SectionEditor.tsx                                     componente React — exporta: SectionEditor
  SectionWizardPreview.tsx                              componente React — exporta: SectionWizardPreview

src/components/permissions/
  ManageGroupsDialog.tsx                                componente React — exporta: ManageGroupsDialog

src/components/pwa/
  PWAInstallBanner.tsx                                  componente React — exporta: PWAInstallBanner
  PWAUpdateBanner.tsx                                   componente React — exporta: PWAUpdateBanner

src/components/store-owner/
  EmitterUpgradeCard.tsx                                componente React — exporta: EmitterUpgradeCard
  OperatingHoursEditor.tsx                              componente React — exporta: DayHours, OperatingHoursEditor
  RedeemPinInput.tsx                                    componente React — exporta: RedemptionResult, maskCpf, RedeemPinInput
  RedemptionHistoryList.tsx                             Lists pending and recently-used redemptions for a store owner.
  StoreBranchesTab.tsx                                  componente React — exporta: StoreBranchesTab
  StoreCampaignTab.tsx                                  componente React — exporta: StoreCampaignTab
  StoreCatalogTab.tsx                                   componente React — exporta: StoreCatalogTab
  StoreEmployeesTab.tsx                                 componente React — exporta: StoreEmployeesTab
  StoreExtratoTab.tsx                                   componente React — exporta: StoreExtratoTab
  StoreInfoTabs.tsx                                     componente React — exporta: StoreTermosTab, StoreTutorialTab, StoreSuporteTab
  StoreOrdersTab.tsx                                    componente React — exporta: StoreOrdersTab
  StoreProfileTab.tsx                                   componente React — exporta: StoreProfileTab
  StoreProfileWizard.tsx                                componente React — exporta: StoreProfileWizard
  StoreRedeemTab.tsx                                    Store owner redemption tab — uses RPC for reliable data fetching.

src/components/store-voucher-wizard/
  OfferCardPreview.tsx                                  componente React — exporta: OfferCardPreview
  StoreVoucherWizard.tsx                                componente React — exporta: StoreVoucherWizard
  types.ts                                              modulo TypeScript — exporta: ScaledValue, SpecificDay, OfferPurpose, StoreVoucherData, WEEKDAY_LABELS, CATEGORY_OPTIONS

src/components/store-voucher-wizard/steps/
  StepBadge.tsx                                         componente React — exporta: StepBadge
  StepCategory.tsx                                      componente React — exporta: StepCategory
  StepCouponType.tsx                                    componente React — exporta: StepCouponType
  StepCumulative.tsx                                    componente React — exporta: StepCumulative
  StepImage.tsx                                         componente React — exporta: StepImage
  StepLimits.tsx                                        componente React — exporta: StepLimits
  StepPurpose.tsx                                       componente React — exporta: StepPurpose
  StepRedemptionType.tsx                                componente React — exporta: StepRedemptionType
  StepReview.tsx                                        componente React — exporta: StepReview
  StepScheduling.tsx                                    componente React — exporta: StepScheduling
  StepSpecificDays.tsx                                  componente React — exporta: StepSpecificDays
  StepTermsAccept.tsx                                   componente React — exporta: StepTermsAccept
  StepValidity.tsx                                      componente React — exporta: StepValidity
  StepValueConfig.tsx                                   componente React — exporta: StepValueConfig

src/components/ui/
  accordion.tsx                                         componente React
  alert-dialog.tsx                                      componente React
  alert.tsx                                             componente React
  animated-counter.tsx                                  componente React — exporta: AnimatedCounter
  badge.tsx                                             componente React — exporta: BadgeProps
  breadcrumb.tsx                                        componente React
  button.tsx                                            componente React — exporta: ButtonProps
  calendar.tsx                                          componente React — exporta: CalendarProps
  card.tsx                                              componente React
  chart.tsx                                             componente React — exporta: ChartConfig
  checkbox.tsx                                          componente React
  collapsible.tsx                                       componente React
  command.tsx                                           componente React
  confirm-dialog.tsx                                    componente React — exporta: ConfirmDialog
  dialog.tsx                                            componente React
  drawer.tsx                                            componente React
  dropdown-menu.tsx                                     componente React
  input.tsx                                             componente React
  label.tsx                                             componente React
  loading-button.tsx                                    componente React — exporta: LoadingButtonProps
  pagination.tsx                                        componente React
  popover.tsx                                           componente React
  progress.tsx                                          componente React
  pull-to-refresh.tsx                                   componente React — exporta: PullToRefresh
  radio-group.tsx                                       componente React
  resizable.tsx                                         componente React
  scroll-area.tsx                                       componente React
  select.tsx                                            componente React
  separator.tsx                                         componente React
  sheet.tsx                                             componente React
  sidebar.tsx                                           componente React
  skeleton.tsx                                          componente React
  slider.tsx                                            componente React
  sonner.tsx                                            componente React
  switch.tsx                                            componente React
  table.tsx                                             componente React
  tabs.tsx                                              componente React
  textarea.tsx                                          componente React — exporta: TextareaProps
  toast.tsx                                             componente React
  toaster.tsx                                           componente React — exporta: Toaster
  toggle.tsx                                            componente React
  tooltip.tsx                                           componente React
  use-toast.ts                                          modulo TypeScript

src/components/voucher-wizard/
  VoucherWizard.tsx                                     componente React — exporta: VoucherWizardData, VoucherWizard

src/components/voucher-wizard/steps/
  StepAudience.tsx                                      componente React — exporta: StepAudience
  StepBranch.tsx                                        componente React — exporta: StepBranch
  StepCampaign.tsx                                      componente React — exporta: StepCampaign
  StepCode.tsx                                          componente React — exporta: StepCode
  StepDiscountType.tsx                                  componente React — exporta: StepDiscountType
  StepDiscountValue.tsx                                 componente React — exporta: StepDiscountValue
  StepReview.tsx                                        componente React — exporta: StepReview
  StepSchedule.tsx                                      componente React — exporta: StepSchedule
  StepTerms.tsx                                         componente React — exporta: StepTerms
  StepTitleDescription.tsx                              componente React — exporta: StepTitleDescription
  StepUsageLimits.tsx                                   componente React — exporta: StepUsageLimits

src/config/
  constants.ts                                          modulo TypeScript — exporta: PAGINATION, CACHE, TIMEOUTS, LIMITS

src/contexts/
  AuthContext.tsx                                       componente React — exporta: AUTH_RETURN_TO_KEY, AuthProvider, useAuth
  BrandContext.tsx                                      Re-export shim — o BrandContext foi dividido em 3 contexts internos (Resolver / Data / Theme) em src/contexts/brand/. Mantemos este arquivo pra back-compat com os 58 import sites existentes. Novo código deve importar dir
  CustomerContext.tsx                                   componente React — exporta: CustomerProvider, useCustomer
  DriverSessionContext.tsx                              componente React — exporta: DriverCustomer, DriverSessionProvider, useDriverSession

src/contexts/__tests__/
  AuthContext.test.tsx                                  AuthContext — bootstrap (getSession + roles), onAuthStateChange (SIGNED_IN/ SIGNED_OUT/PASSWORD_RECOVERY), hasRole + isRootAdmin, signOut voluntário vs sessão expirada, returnTo persistido em sessionStorage, dedup de fet
  CustomerContext.test.tsx                              CustomerContext — resolve customer record do user atual no brand+branch, suporta impersonation (admin via ?customerId), auto-link de orphan de motorista (criado pelo webhook sem user_id), move customer entre branches, au
  DriverSessionContext.test.tsx                         DriverSessionContext — CPF-only login (sem auth.users), persistência em localStorage por brand, edge function `driver-cpf-login` com fallback RPC, rate limit detection, session request handoff entre tabs/sessões. Bug aqu

src/contexts/brand/
  BrandDataContext.tsx                                  componente React — exporta: BrandDataProvider, useBrandData
  BrandResolverContext.tsx                              componente React — exporta: BrandResolverProvider, BrandResolverOverride, useBrandResolver
  BrandThemeContext.tsx                                 componente React — exporta: BrandThemeProvider, useBrandThemeContext
  index.tsx                                             componente React — exporta: BrandProvider, BrandProviderOverride, BrandContextType, useBrand
  utils.ts                                              modulo TypeScript — exporta: Brand, Branch, isTransientNetworkError, withNetworkRetry, fetchBrandById, resolveBrandByDomain

src/contexts/brand/__tests__/
  BrandDataContext.test.tsx                             BrandDataContext — fetcha branches do brand resolvido, restaura selected_branch_id do profile, auto-detect por geo após 1.5s (deferred pra não bloquear FCP), persist no profile ao mudar. Bug aqui = branch vaza ao trocar 
  BrandResolverContext.test.tsx                         BrandResolverContext — resolve brand do tenant via brandId param, hostname (white-label) ou role do user logado. Tem safety timeout 2s pra evitar boot eterno e re-resolve quando user/roles mudam. BrandResolverOverride — 
  BrandThemeContext.test.tsx                            BrandThemeContext — gating do tema por rota: SÓ aplica em /c/ e /customer-preview (ou forceApply=true). Fora dessas rotas, brand_settings_json fica null e useBrandTheme não roda. Bug aqui = tema custom vaza em rota admin
  index.test.tsx                                        brand/index — BrandProvider (compõe Resolver → Data → Theme), BrandProviderOverride (white-label/preview), useBrand back-compat hook. Bug aqui = ordem dos providers errada (Data não vê Resolver), Override não aplica forc
  utils.test.ts                                         brand/utils — fetchBrandById (cache + public_brands_safe + brands), resolveBrandByDomain (subdomain + custom domain), findNearestBranch, withNetworkRetry (transient-only backoff). Bug aqui = brand resolve errado por host

src/features/admin_origens/
  pagina_admin_origens.tsx                              componente React — exporta: PaginaAdminOrigens

src/features/agendar_demonstracao/
  pagina_agendar_demonstracao.tsx                       componente React — exporta: PaginaAgendarDemonstracao

src/features/agendar_demonstracao/components/
  bloco_header_demo.tsx                                 componente React — exporta: BlocoHeaderDemo
  bloco_resumo_produto.tsx                              componente React — exporta: BlocoResumoProduto
  bloco_sucesso_demo.tsx                                componente React — exporta: BlocoSucessoDemo
  bloco_topbar_demo.tsx                                 componente React — exporta: BlocoTopbarDemo
  formulario_agendar_demo.tsx                           componente React — exporta: FormularioAgendarDemo

src/features/agendar_demonstracao/constants/
  constantes_demo.ts                                    modulo TypeScript — exporta: OPCOES_CARGO, OPCOES_FAIXA_MOTORISTAS, OPCOES_SOLUCAO_ATUAL, OPCOES_CANAL_CONTATO, OPCOES_JANELA, STATUS_LABELS

src/features/agendar_demonstracao/hooks/
  hook_submeter_lead.ts                                 modulo TypeScript — exporta: useSubmeterLead

src/features/agendar_demonstracao/schemas/
  schema_agendar_demo.ts                                modulo TypeScript — exporta: schemaAgendarDemo, FormularioAgendarDemo

src/features/agendar_demonstracao/schemas/__tests__/
  schema_agendar_demo.test.ts                           schemaAgendarDemo — Zod schema do form de agendamento de demo comercial. Bug aqui = e-mail com whitespace/case passa errado pro CRM, telefone sem DDD aceito, full_name com 2 chars (= apelido), enum invalid permite data c

src/features/agendar_demonstracao/services/
  servico_leads.ts                                      modulo TypeScript — exporta: submeterLeadComercial

src/features/agendar_demonstracao/services/__tests__/
  servico_leads.test.ts                                 servico_leads — POST a edge function `submit-commercial-lead`. Bug aqui = erro de rede vira success=true silenciosamente, mensagem de erro do edge function não chega no toast, payload vazio passa por validação client mas

src/features/agendar_demonstracao/types/
  tipos_lead.ts                                         modulo TypeScript — exporta: CanalContato, JanelaContato, FaixaMotoristas, SolucaoAtual, LeadComercialPayload, LeadComercialResponse

src/features/auditoria_duplicacoes/
  pagina_auditoria_duplicacoes.tsx                      Página /admin/auditoria-duplicacoes Relatório consolidado de itens de menu que aparecem em mais de um lugar nos consoles Root, Empreendedor (Brand) e Cidade (Branch). Acesso restrito a Root Admin (via RootGuard no App.ts

src/features/catalogo_produtos/
  pagina_catalogo_produtos.tsx                          componente React — exporta: PaginaCatalogoProdutos

src/features/central_modulos/
  pagina_central_modulos.tsx                            Fase 4.1b - rebuild forçado em 2026-04-18 v3 (invalidar cache de bundle do preview)

src/features/central_modulos/components/
  aba_auditoria.tsx                                     componente React — exporta: AbaAuditoria
  aba_catalogo.tsx                                      Fase 4.1b — chunk version bump para forçar invalidação de CDN
  aba_cidades.tsx                                       componente React — exporta: __PHASE_4_1B_CID_REBUILD, AbaCidades
  aba_empreendedores.tsx                                componente React — exporta: __PHASE_4_1B_EMP_REBUILD, AbaEmpreendedores
  aba_manual.tsx                                        AbaManual — Sub-fase 5.10 Renderiza o grupo "Central de Módulos (Root)" do catálogo de manuais dentro da própria Central de Módulos, evitando que o usuário precise sair da página para consultar a documentação.
  aba_modelos_negocio.tsx                               AbaModelosNegocio — Sub-fase 5.3 + 5.4 Wrapper da aba "Modelos de Negócio" da Central de Módulos. Sub-tabs: - Catálogo de Modelos - Modelos × Planos - Pricing (Ganha-Ganha)
  aba_planos.tsx                                        Fase 4.1b — chunk version bump para forçar invalidação de CDN
  aba_templates.tsx                                     componente React — exporta: AbaTemplates
  badge_modelo_negocio.tsx                              BadgeModeloNegocio — Sub-fase 5.3 Badge atômica colorida representando um Modelo de Negócio. - Variante sólida quando required (vínculo obrigatório). - Variante outlined quando optional. - Trunca o nome em 14 chars (com 
  badges_modelos_do_modulo.tsx                          BadgesModelosDoModulo — Sub-fase 5.3 Renderiza, para um módulo técnico, as badges dos Modelos de Negócio a que pertence. Máximo 3 visíveis + popover "+N" com a lista completa. Ordem: required primeiro (sólidas), depois o
  card_modelo_negocio.tsx                               CardModeloNegocio — Sub-fase 5.3 Card visual distinto que representa um Modelo de Negócio (produto comercial). - Barra lateral colorida de 4px com a `color` do modelo - Ícone grande (h-10 w-10) em chip arredondado - Titl
  card_pricing_plano.tsx                                CardPricingPlano — Sub-fase 5.4 Card por plano: preço por ponto + opções avançadas (margens) + salvar.
  dialog_aplicar_template.tsx                           componente React — exporta: DialogAplicarTemplate
  dialog_conceder_addon.tsx                             DialogConcederAddon — Sub-fase 6.1 Modal de concessão manual de add-on (Root Admin). Seleciona Marca + Modelo + Ciclo + Preço + Validade + Notas.
  dialog_criar_modelo.tsx                               DialogCriarModelo — Sub-fase 5.3 Form completo para criar um novo Business Model. Validações: - key: lowercase_underscore, único - name obrigatório - audience: cliente | motorista | b2b - pricing_model: included | usage_
  dialog_editar_modelo.tsx                              DialogEditarModelo — Sub-fase 5.3 Dialog de edição de um Business Model com 3 seções: 1. Identidade (editáveis: name, description, icon, color, sort_order, is_active) 2. Imutáveis (key, audience, pricing_model — read-onl
  dialog_editor_template.tsx                            componente React — exporta: DialogEditorTemplate
  modal_modulo_form.tsx                                 componente React — exporta: ModalModuloForm
  painel_aplicacao_massa.tsx                            componente React — exporta: PainelAplicacaoMassa
  secao_addons_vendidos.tsx                             SecaoAddonsVendidos — Sub-fase 6.1 Lista todos os add-ons concedidos a marcas, com filtros e ações.
  secao_catalogo_modelos.tsx                            SecaoCatalogoModelos — Sub-fase 5.3 Lista os 13 modelos de negócio agrupados por audience (Cliente/Motorista/B2B). Inclui busca, filtros por audience e botão "Novo Modelo".
  secao_modelos_planos.tsx                              SecaoModelosPlanos — Sub-fase 5.3 Matriz Modelos × Planos. - Linhas: 13 business_models (agrupados por audience) - Colunas: 4 planos (free, starter, profissional, enterprise) - Célula: checkbox is_included - Cabeçalho do
  secao_pricing_ganha_ganha.tsx                         SecaoPricingGanhaGanha — Sub-fase 5.4 Wrapper da sub-tab "Pricing" da aba Modelos de Negócio. Composição: 1) Cards de preço por ponto (1 por plano) 2) Simulador financeiro 3) Tabela de empreendedores com GG ativo
  simulador_financeiro_gg.tsx                           SimuladorFinanceiroGG — Sub-fase 5.4 Calcula em tempo real custo Raiz→Empreendedor, receita Empr.←Loja e margem líquida. Alerta se margem extrapola limites do plano.
  tabela_brands_ganha_ganha.tsx                         TabelaBrandsGanhaGanha — Sub-fase 5.4 Lista read-only de empreendedores com Ganha-Ganha ativo.

src/features/central_modulos/constants/
  constantes_planos.ts                                  modulo TypeScript — exporta: DefinicaoPlano, PLANS, PlanKey

src/features/central_modulos/hooks/
  hook_auditoria_modulos.ts                             modulo TypeScript — exporta: AuditoriaModuloRow, useAuditoriaModulos
  hook_brand_modules_admin.ts                           modulo TypeScript — exporta: BrandResumo, BrandModuloLinha, BrandModulesOverview, useBrandList, useBrandModulesAdmin, useToggleBrandModule
  hook_catalogo.ts                                      modulo TypeScript — exporta: ModuleDefinitionRow, NovoModuloInput, useCatalogoModulos, useCriarModulo, useAtualizarModulo, useToggleModuloAtivo
  hook_city_overrides.ts                                modulo TypeScript — exporta: BranchResumo, EstadoOverride, OverviewLinhaCidade, useBranchList, useCityModulesOverview, useCycleOverrideState
  hook_module_templates.ts                              hook_module_templates — Templates livres de módulos ---------------------------------------------------- Permite ao Root salvar conjuntos reutilizáveis de módulos e aplicá-los em lote a marcas (brand_modules) e/ou cidade
  hook_plan_matrix.ts                                   modulo TypeScript — exporta: LinhaTemplatePlano, usePlanModuleMatrix, useTogglePlanModule, useBulkSetPlanModules, useImpactoAplicarRetro, useAplicarRetroativamente

src/features/city_onboarding/
  pagina_onboarding_cidade.tsx                          componente React — exporta: PaginaOnboardingCidade

src/features/city_onboarding/components/
  acoes_cidade.tsx                                      componente React — exporta: AcoesCidade
  etapa_onboarding.tsx                                  componente React — exporta: EtapaOnboardingCard
  indicador_progresso.tsx                               componente React — exporta: IndicadorProgresso
  indicador_status.tsx                                  componente React — exporta: IndicadorStatus
  painel_teste_final.tsx                                componente React — exporta: PainelTesteFinal
  seletor_cidade.tsx                                    componente React — exporta: SeletorCidade

src/features/city_onboarding/constants/
  constantes_etapas.ts                                  modulo TypeScript — exporta: ETAPAS_ONBOARDING

src/features/city_onboarding/hooks/
  hook_escopo_produto.ts                                hook_escopo_produto — useProductScope -------------------------------------- Centraliza a leitura do escopo do produto comercial (plano) contratado pela marca. Combina: - brands.subscription_plan → plano vigente - plan_b
  hook_validacao_cidade.ts                              modulo TypeScript — exporta: useValidacaoCidade

src/features/city_onboarding/types/
  tipos_onboarding.ts                                   modulo TypeScript — exporta: StatusEtapa, ResultadoValidacao, ValidacaoCidade, EtapaOnboarding

src/features/compra_pontos_motorista/
  pagina_compra_pontos_config.tsx                       componente React — exporta: PaginaCompraPontosConfig

src/features/conectores_origem/
  lista_conectores.tsx                                  componente React — exporta: ListaConectores

src/features/conectores_origem/componentes/
  card_conector.tsx                                     componente React — exporta: CardConector
  modal_conector.tsx                                    componente React — exporta: ModalConector

src/features/configuracao_cidade/
  pagina_configuracao_cidade.tsx                        componente React — exporta: PaginaConfiguracaoCidade

src/features/configuracao_cidade/components/
  painel_toggles_cidade.tsx                             componente React — exporta: PainelTogglesCidade
  seletor_cidade_config.tsx                             componente React — exporta: SeletorCidadeConfig

src/features/configuracao_cidade/constants/
  constantes_toggles.ts                                 modulo TypeScript — exporta: ToggleCidadeConfig, TOGGLES_CIDADE

src/features/configuracao_cidade/hooks/
  hook_configuracao_cidade.ts                           modulo TypeScript — exporta: CidadeOption, useCidadesDisponiveis, useConfiguracaoCidade

src/features/configuracao_modulos_cidade/
  pagina_configuracao_modulos_cidade.tsx                componente React — exporta: PaginaConfiguracaoModulosCidade

src/features/configuracao_modulos_cidade/components/
  card_modulo_cidade.tsx                                componente React — exporta: CardModuloCidade
  seletor_cidade_modulos.tsx                            componente React — exporta: SeletorCidadeModulos

src/features/diagnostico_marca/
  pagina_diagnostico_marca.tsx                          componente React — exporta: PaginaDiagnosticoMarca

src/features/diagnostico_marca/components/
  cabecalho_diagnostico.tsx                             componente React — exporta: CabecalhoDiagnostico
  card_resumo_produto.tsx                               componente React — exporta: CardResumoProduto
  dialog_diff_template.tsx                              componente React — exporta: DialogDiffTemplate
  tabela_modulos_origem.tsx                             componente React — exporta: TabelaModulosOrigem

src/features/diagnostico_marca/hooks/
  hook_diagnostico_marca.ts                             modulo TypeScript — exporta: useDiagnosticoMarca, useReaplicarTemplate

src/features/diagnostico_marca/services/
  servico_diagnostico_marca.ts                          modulo TypeScript — exporta: buscarDiagnosticoMarca, reaplicarTemplateMarca

src/features/diagnostico_marca/types/
  tipos_diagnostico.ts                                  Tipos para a feature de Diagnóstico por Marca. Esta tela permite ao Root Admin auditar a origem de cada módulo ativo em uma marca específica (Núcleo, Produto, Modelo de Negócio, Manual).

src/features/diagnostico_marca/utils/
  utilitarios_origem_modulo.ts                          Função pura de classificação de origem de módulos. Reaproveitada pela página de diagnóstico e pelos testes de integração de promessa do produto.

src/features/diagnostico_marca/utils/__tests__/
  utilitarios_origem_modulo.test.ts                     utilitarios_origem_modulo — classifica origem de cada módulo (core/produto/modelo/manual), calcula esperados pelo plano, diff vs marca atual, delta na troca de plano. Bug aqui = módulo ativo sem origem estrutural não vir

src/features/gestao_motoristas/components/
  barra_busca_motoristas.tsx                            componente React — exporta: BarraBuscaMotoristas
  menu_download_csv.tsx                                 componente React — exporta: MenuDownloadCsv
  paginacao_motoristas.tsx                              componente React — exporta: PaginacaoMotoristas

src/features/gestao_motoristas/hooks/
  hook_exportar_motoristas.ts                           modulo TypeScript — exporta: ProgressoExportacao, ArquivoPendente, ParametrosUseExportar, useExportarMotoristas
  hook_listagem_motoristas.ts                           modulo TypeScript — exporta: StatusFiltro, ParametrosListagem, ResultadoListagem, useListagemMotoristas

src/features/gestao_motoristas/hooks/__tests__/
  hook_exportar_motoristas.test.tsx                     suite de testes

src/features/gestao_motoristas/services/
  servico_exportacao_motoristas.ts                      modulo TypeScript — exporta: ParametrosExportacao, ResultadoExportacao, exportarTodosMotoristas

src/features/gestao_motoristas/utils/
  utilitarios_export_motoristas.ts                      modulo TypeScript — exporta: gerarCsvMotoristas, ehStandalonePWA, ehIOS, exigeUrlHttps, BUCKET_EXPORTACOES, ResultadoUploadExport
  utilitarios_filtros_motoristas.ts                     modulo TypeScript — exporta: apenasDigitos, ehBuscaPorPlaca, aplicarFiltroStatus, precisaPreFiltrarPorProfiles

src/features/gestao_motoristas/utils/__tests__/
  utilitarios_export_motoristas.test.ts                 suite de testes
  utilitarios_filtros_motoristas.test.ts                utilitarios_filtros_motoristas — `ehBuscaPorPlaca`, `apenasDigitos`, `aplicarFiltroStatus`, `precisaPreFiltrarPorProfiles`. Bug aqui = busca por placa não detecta formato Mercosul (ABC1D23) ou tradicional (ABC1234), apli

src/features/importacao_motoristas/components/
  etapa_preview.tsx                                     componente React — exporta: EtapaPreview
  etapa_progresso.tsx                                   componente React — exporta: EtapaProgresso
  etapa_resultado.tsx                                   componente React — exporta: EtapaResultado
  etapa_upload.tsx                                      componente React — exporta: EtapaUpload
  modal_importar_motoristas.tsx                         componente React — exporta: ModalImportarMotoristas

src/features/importacao_motoristas/hooks/
  hook_importar_motoristas.ts                           modulo TypeScript — exporta: useImportarMotoristas
  hook_job_em_andamento.ts                              modulo TypeScript — exporta: useJobEmAndamento

src/features/importacao_motoristas/types/
  tipos_importacao.ts                                   Tipos para importação massiva de motoristas a partir de planilhas TaxiMachine.

src/features/importacao_motoristas/utils/
  mapeador_taximachine.ts                               modulo TypeScript — exporta: normalizarChave, mapearLinha, calcularResumoMapeamento
  parser_planilha.ts                                    modulo TypeScript — exporta: parsearArquivo, parsearTextoCsv
  upload_planilha_storage.ts                            modulo TypeScript — exporta: uploadPlanilhaParaStorage

src/features/importacao_motoristas/utils/__tests__/
  mapeador_taximachine.test.ts                          mapeador_taximachine — converte linhas brutas do CSV/XLSX do TaxiMachine pro schema interno (LinhaMapeada). Parser brasileiro de datas (12/03/1985), detecção de flags de pagamento/serviço por sufixo, taxas por prefixo, h
  upload_planilha_storage.test.ts                       uploadPlanilhaParaStorage — sobe JSON pra Storage privado (workaround pra iPhone PWA com payloads > 1MB que morrem no .invoke()). Bug aqui = sessão sem user_id permite upload anônimo (RLS bypass), path sem userId quebra 

src/features/integracao_mobilidade/components/
  aba_mensagens.tsx                                     componente React — exporta: AbaMensagens
  aba_notificacoes.tsx                                  componente React — exporta: AbaNotificacoes
  aba_pontuar_motorista.tsx                             componente React — exporta: AbaPontuarMotorista
  aba_pontuar_passageiro.tsx                            componente React — exporta: AbaPontuarPassageiro
  card_adicionar_cidade.tsx                             componente React — exporta: CardAdicionarCidade
  card_cidades_conectadas.tsx                           componente React — exporta: CardCidadesConectadas
  card_config_cidade.tsx                                componente React — exporta: CardConfigCidade
  card_credenciais_matriz.tsx                           componente React — exporta: CardCredenciaisMatriz
  editor_template_mensagem.tsx                          componente React — exporta: EditorTemplateMensagem
  envio_manual_mensagem.tsx                             componente React — exporta: EnvioManualMensagem
  historico_notificacoes_motorista.tsx                  componente React — exporta: HistoricoNotificacoesMotorista
  lista_fluxos_mensagem.tsx                             componente React — exporta: ListaFluxosMensagem
  lista_templates_mensagem.tsx                          componente React — exporta: ListaTemplatesMensagem
  relatorio_mensagens.tsx                               componente React — exporta: RelatorioMensagens

src/features/integracao_mobilidade/constants/
  constantes_mensagens.ts                               modulo TypeScript — exporta: CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS

src/features/integracao_mobilidade/hooks/
  hook_historico_notificacoes_motorista.ts              modulo TypeScript — exporta: NotificacaoMotorista, useHistoricoNotificacoesMotorista
  hook_integracoes.ts                                   modulo TypeScript — exporta: Integration, Branch, BrandMatrix, useIntegracoes
  hook_message_flows.ts                                 modulo TypeScript — exporta: MessageFlow, MessageLog, EVENT_TYPES, AUDIENCE_OPTIONS, AVAILABLE_VARS, useMessageFlows
  hook_message_templates.ts                             modulo TypeScript — exporta: MessageTemplate, useMessageTemplates
  hook_relatorio_mensagens.ts                           modulo TypeScript — exporta: ResumoMensagens, EnvioPorDia, EnvioPorEvento, useRelatorioMensagens

src/features/landing_produto/
  pagina_landing_produto.tsx                            componente React — exporta: PaginaLandingProduto

src/features/landing_produto/components/
  bloco_como_funciona.tsx                               componente React — exporta: BlocoComoFunciona
  bloco_cta_final.tsx                                   componente React — exporta: BlocoCtaFinal
  bloco_cta_sticky_mobile.tsx                           componente React — exporta: BlocoCtaStickyMobile
  bloco_depoimentos.tsx                                 componente React — exporta: BlocoDepoimentos
  bloco_dores_solucoes.tsx                              componente React — exporta: BlocoDoresSolucoes
  bloco_faq.tsx                                         componente React — exporta: BlocoFaq
  bloco_footer.tsx                                      componente React — exporta: BlocoFooter
  bloco_funcionalidades_grid.tsx                        componente React — exporta: BlocoFuncionalidadesGrid
  bloco_hero.tsx                                        componente React — exporta: BlocoHero
  bloco_metricas_destaque.tsx                           componente React — exporta: BlocoMetricasDestaque
  bloco_para_quem.tsx                                   componente React — exporta: BlocoParaQuem
  bloco_perguntas_objecoes.tsx                          componente React — exporta: BlocoPerguntasObjecoes
  bloco_preview_app.tsx                                 componente React — exporta: BlocoPreviewApp
  bloco_pricing_destaque.tsx                            componente React — exporta: BlocoPricingDestaque
  bloco_screenshots.tsx                                 componente React — exporta: BlocoScreenshots
  bloco_topbar.tsx                                      componente React — exporta: BlocoTopbar
  toggle_ciclo.tsx                                      componente React — exporta: CicloCobranca, ToggleCiclo

src/features/landing_produto/utils/
  sanitizar_landing.ts                                  Sanitização defensiva no ponto de consumo da landing pública. Defesa em profundidade — o hook `useProdutoPorSlug` já normaliza, mas garantimos novamente o shape antes de passar pra qualquer componente filho. Itens fora d

src/features/landing_produto/utils/__tests__/
  sanitizar_landing.test.ts                             sanitizar_landing — defesa em profundidade contra React error #31 (render de objeto cru). Aceita só shapes esperados, descarta o resto. Bug aqui = passa undefined/null/objeto sem title → JSX explode com "Objects are not 

src/features/leads_comerciais/
  pagina_detalhes_lead.tsx                              componente React — exporta: PaginaDetalhesLead
  pagina_leads_comerciais.tsx                           componente React — exporta: PaginaLeadsComerciais

src/features/leads_comerciais/components/
  bloco_cabecalho_lead.tsx                              componente React — exporta: BlocoCabecalhoLead
  bloco_filtros_leads.tsx                               componente React — exporta: BlocoFiltrosLeads
  bloco_historico_lead.tsx                              componente React — exporta: BlocoHistoricoLead
  bloco_info_lead.tsx                                   componente React — exporta: BlocoInfoLead
  bloco_kpis_leads.tsx                                  componente React — exporta: BlocoKpisLeads
  bloco_status_lead.tsx                                 componente React — exporta: BlocoStatusLead
  bloco_tabela_leads.tsx                                componente React — exporta: BlocoTabelaLeads
  dialogo_editar_lead.tsx                               componente React — exporta: DialogoEditarLead

src/features/leads_comerciais/hooks/
  hook_detalhes_lead.ts                                 modulo TypeScript — exporta: useDetalhesLead, useNotasLead, useAtualizarStatusLead, useCriarNotaLead, useAtualizarCamposLead
  hook_leads_comerciais.ts                              modulo TypeScript — exporta: useLeadsComerciais

src/features/leads_comerciais/schemas/
  schema_edicao_lead.ts                                 modulo TypeScript — exporta: schemaEdicaoLead, DadosEdicaoLead

src/features/leads_comerciais/schemas/__tests__/
  schema_edicao_lead.test.ts                            schemaEdicaoLead — Zod schema do form de edição de lead comercial. Bug aqui = e-mail inválido aceito no UPDATE, full_name vazio quebra exports, UTM params sem trim acumulam whitespace no banco.

src/features/leads_comerciais/services/
  servico_detalhes_lead.ts                              modulo TypeScript — exporta: buscarLeadPorId, atualizarStatusLead, AtualizacaoCamposLead, atualizarCamposLead, listarNotasLead, criarNotaLead
  servico_leads_comerciais.ts                           modulo TypeScript — exporta: FiltrosLeadsComerciais, listarLeadsComerciais

src/features/leads_comerciais/services/__tests__/
  servico_detalhes_lead.test.ts                         servico_detalhes_lead — CRUD de leads comerciais (commercial_leads) + notas (commercial_lead_notes). atualizarStatusLead carimba timestamp por status (contatado/qualificado/convertido). Bug aqui = status muda sem timesta
  servico_leads_comerciais.test.ts                      servico_leads_comerciais — listagem com múltiplos filtros (status, período, empresa, UTM, busca textual). Bug aqui = filtro vazio gera WHERE inválido (timeout query), busca curta vira full-table-scan, status null vaza le

src/features/leads_comerciais/types/
  tipos_nota_lead.ts                                    modulo TypeScript — exporta: TipoNotaLead, NotaLeadRow

src/features/leads_comerciais/utils/
  utilitarios_kpis.ts                                   modulo TypeScript — exporta: KpisLeads, calcularKpis

src/features/leads_comerciais/utils/__tests__/
  utilitarios_kpis.test.ts                              utilitarios_kpis — calcula KPIs do dashboard de leads comerciais (total mês, convertidos, taxa, top-5 produtos). Bug aqui = taxaConversao com /0 vira NaN, top-5 ordenado errado (alphabetical em vez de count), totalNoMes 

src/features/loja_publica/
  pagina_loja_publica.tsx                               componente React — exporta: PaginaLojaPublica

src/features/loja_publica/components/
  cabecalho_loja.tsx                                    componente React — exporta: CabecalhoLoja
  faq_loja.tsx                                          componente React — exporta: FaqLoja
  galeria_loja.tsx                                      componente React — exporta: GaleriaLoja
  horario_funcionamento.tsx                             componente React — exporta: HorarioFuncionamento
  info_contato_loja.tsx                                 componente React — exporta: InfoContatoLoja

src/features/onboarding_espelhamento/componentes/
  checklist_onboarding.tsx                              componente React — exporta: ChecklistOnboarding

src/features/onboarding_espelhamento/hooks/
  hook_progresso_onboarding.ts                          modulo TypeScript — exporta: PassoOnboarding, useProgressoOnboardingAdmin, useProgressoOnboardingEmpreendedor

src/features/pacotes_pontos/
  pagina_loja_pacotes.tsx                               componente React — exporta: PaginaLojaPacotes
  pagina_pacotes_pontos.tsx                             componente React — exporta: PaginaPacotesPontos

src/features/pacotes_pontos/components/
  dialogo_criar_pacote.tsx                              componente React — exporta: DialogoCriarPacote
  lista_pacotes.tsx                                     componente React — exporta: ListaPacotes
  tabela_pedidos.tsx                                    componente React — exporta: TabelaPedidos

src/features/pacotes_pontos/hooks/
  hook_loja_pacotes.ts                                  modulo TypeScript — exporta: usePacotesDisponiveis, useMeusPedidos, useComprarPacote
  hook_pacotes_pontos.ts                                modulo TypeScript — exporta: usePacotesPontos, usePacotesPontosOrders, useCriarPacote, useAtualizarPacote, useConfirmarPedido, useCancelarPedido

src/features/pacotes_pontos/utils/
  utilitarios_pacotes.ts                                modulo TypeScript — exporta: formatarPreco, formatarPontos, statusLabel, statusVariant

src/features/pacotes_pontos/utils/__tests__/
  utilitarios_pacotes.test.ts                           utilitarios_pacotes — format helpers (preço/pontos) + status labels/variants. Bug aqui = formatação BRL errada (US$ em vez de R$), status desconhecido crasha o badge (sem fallback), pontos sem separador de milhar viram '

src/features/pagina_links/
  pagina_links.tsx                                      componente React — exporta: PaginaLinks

src/features/painel_modelos_negocio/
  aba_modelos_negocio_brand.tsx                         AbaModelosNegocioBrand — Sub-fase 5.5 Wrapper da nova aba "Modelos de Negócio" no painel do empreendedor. Mostrada APENAS quando `useBusinessModelsUiEnabled` retorna true.
  aba_modelos_por_cidade.tsx                            AbaModelosPorCidade — Sub-fase 5.6 Aba "Modelos por Cidade" do painel do empreendedor. Pode ser renderizada em 2 contextos: - brand_admin (em /brand-modules) → mostra Select de cidades - branch_admin (em /branch-business
  pagina_configurar_ganha_ganha.tsx                     PaginaConfigurarGanhaGanha — Sub-fase 5.5 Rota: /brand-modules/ganha-ganha Permite o empreendedor: - Entender o fluxo Raiz → Empreendedor → Loja - Definir sua margem (`ganha_ganha_margin_pct`) - Simular custo, receita e 
  pagina_modelos_por_cidade_branch.tsx                  PaginaModelosPorCidadeBranch — Sub-fase 5.6 Rota: /branch-business-models Versão da aba "Modelos por Cidade" para branch_admin: - Cidade fixada via `useBrandGuard().currentBranchId` - Select escondido Visibilidade: - Só 

src/features/painel_modelos_negocio/components/
  card_modelo_brand.tsx                                 CardModeloBrand — Sub-fase 5.5 Card de 1 modelo no painel do empreendedor. Estados: active | available_inactive | locked
  card_modelo_cidade.tsx                                CardModeloCidade — Sub-fase 5.6 Card de 1 modelo na visão "Modelos por Cidade". Estados visuais (4): - inherited_on → marca ativou + sem override (switch ON) - inherited_off → marca não ativou (switch OFF + DISABLED) - o
  feature_toggle.tsx                                    FeatureToggle — Sprint 3 Toggle compacto para uma feature do Duelo (cinturao | aposta | ranking). Lê via useBrandFeature e escreve via useSetBrandDueloFeature.
  grid_modelos_brand.tsx                                GridModelosBrand — Sub-fase 5.5 Grid de modelos agrupado por audience (Cliente | Motorista | B2B).
  header_modelos_brand.tsx                              HeaderModelosBrand — Sub-fase 5.5 Header da aba "Modelos de Negócio" do empreendedor.
  header_overrides_cidade.tsx                           HeaderOverridesCidade — Sub-fase 5.6 Cabeçalho da tela de overrides por cidade: - Título + descrição - Contadores (ativos / desligados pela cidade / inativos na marca) - Botão "Voltar tudo ao herdado" (só aparece se há a
  seletor_cidade_overrides.tsx                          SeletorCidadeOverrides — Sub-fase 5.6 Select com as branches da marca, usado pelo brand_admin para escolher qual cidade está editando.

src/features/produtos_comerciais/
  pagina_produtos_comerciais.tsx                        componente React — exporta: PaginaProdutosComerciais

src/features/produtos_comerciais/__tests__/
  layout_sidebar.test.ts                                suite de testes
  promessa_produto.integration.test.ts                  suite de testes

src/features/produtos_comerciais/components/
  dialog_confirmar_remover_grupo.tsx                    componente React — exporta: DialogConfirmarRemoverGrupo
  passo_identificacao.tsx                               componente React — exporta: PassoIdentificacao
  passo_landing.tsx                                     componente React — exporta: PassoLanding
  passo_landing_beneficios.tsx                          componente React — exporta: PassoLandingBeneficios
  passo_landing_faq.tsx                                 componente React — exporta: PassoLandingFaq
  passo_landing_provas.tsx                              componente React — exporta: PassoLandingProvas
  passo_landing_visual.tsx                              componente React — exporta: PassoLandingVisual
  passo_modelos.tsx                                     componente React — exporta: PassoModelos
  passo_modulos.tsx                                     componente React — exporta: PassoModulos
  passo_preview.tsx                                     componente React — exporta: PassoPreview
  passo_revisao.tsx                                     componente React — exporta: PassoRevisao
  preview_landing.tsx                                   componente React — exporta: PreviewLanding
  preview_sidebar_grupo.tsx                             componente React — exporta: PreviewSidebarGrupo
  preview_sidebar_item.tsx                              componente React — exporta: PreviewSidebarItem
  wizard_produto.tsx                                    componente React — exporta: WizardProduto

src/features/produtos_comerciais/constants/
  constantes_template.ts                                Template pré-preenchido — Vale Resgate Motorista Premium. Serve como ponto de partida para o usuário criar um produto comercial de prateleira sem começar do zero. Após carregar o template, basta ajustar `plan_key`, `slug

src/features/produtos_comerciais/hooks/
  hook_layout_sidebar_produto.ts                        modulo TypeScript — exporta: useLayoutSidebarProduto
  hook_modulos_por_modelo.ts                            modulo TypeScript — exporta: ModuloDef, VinculoModelo, useModulosPorModelo
  hook_produtos_comerciais.ts                           hook_produtos_comerciais — CRUD completo de Produtos Comerciais. Abstrai sobre `subscription_plans` + sincroniza: - `plan_business_models` (modelos liberados pelo produto) - `plan_module_templates` (módulos pré-ativados 

src/features/produtos_comerciais/types/
  tipos_produto.ts                                      Tipos de Produtos Comerciais (Bundles vendáveis). Sub-fase 6.3 — estende `subscription_plans` para virar fábrica de produtos.

src/features/produtos_comerciais/utils/
  utilitarios_layout_sidebar.ts                         modulo TypeScript — exporta: ItemEfetivo, GrupoEfetivo, mesclarLayout, construirGruposEfetivos, snapshotComoOverride, moverGrupo
  utilitarios_link_publico.ts                           Utilitários para gerar links públicos dos produtos comerciais. O domínio é fixo na produção (`app.valeresgate.com.br`) para evitar que links copiados dentro do editor Lovable apontem para o preview.

src/features/produtos_comerciais/utils/__tests__/
  utilitarios_link_publico.test.ts                      utilitarios_link_publico — gera links HTTPS pra landing e /trial. Bug aqui = link copiado do editor Lovable apontava pro preview (em vez de produção). Solução fixou o origin — esses testes garantem que o domínio nunca mu

src/features/relatorio_corridas/
  pagina_relatorio_corridas.tsx                         componente React — exporta: PaginaRelatorioCorridas

src/features/relatorio_corridas/components/
  grafico_corridas_cidade.tsx                           componente React — exporta: GraficoCorridasCidade
  kpis_relatorio.tsx                                    componente React — exporta: KpisRelatorio
  tabela_cidades.tsx                                    componente React — exporta: TabelaCidades

src/features/relatorio_corridas/hooks/
  hook_relatorio_corridas.ts                            modulo TypeScript — exporta: useRelatorioCorridas

src/features/relatorio_corridas/types/
  tipos_relatorio_corridas.ts                           modulo TypeScript — exporta: RelatorioCidadeRow

src/features/relatorio_corridas/utils/
  utilitarios_export_csv.ts                             modulo TypeScript — exporta: exportarRelatorioCsv

src/features/relatorios_gg/components/
  filtros_relatorio_gg.tsx                              componente React — exporta: RangeAtalho, FiltrosRelatorioGg
  grafico_temporal_gg.tsx                               componente React — exporta: GraficoTemporalGg
  kpis_relatorio_gg.tsx                                 componente React — exporta: KpisRelatorioGg
  tabela_breakdown_gg.tsx                               componente React — exporta: TabelaBreakdownGg, fmtTabela

src/features/relatorios_gg/utils/
  utilitarios_export_gg.ts                              utilitarios_export_gg — Sub-fase 5.8 ------------------------------------ Geração client-side de CSV e PDF dos Relatórios Cashback + registro de audit_logs (action='csv_exported' | 'pdf_exported').

src/features/trial_signup/services/
  servico_trial_signup.ts                               servico_trial_signup — Normalização do plano consumido pela rota pública /trial. Garante que qualquer payload vindo de `subscription_plans` (incluindo formatos ricos usados pela landing comercial, como objetos em `landin

src/features/trial_signup/services/__tests__/
  servico_trial_signup.test.ts                          servico_trial_signup — normaliza row de subscription_plans pra shape primitivo seguro (defesa contra React error #31 na rota pública /trial). Bug aqui = row com landing_config_json (objeto) passa cru pro JSX e crasha a l

src/features/ubiz_ofertas/
  pagina_ubiz_ofertas.tsx                               componente React — exporta: PaginaUbizOfertas

src/features/ubiz_ofertas/components/
  cabecalho_ofertas.tsx                                 componente React — exporta: CabecalhoOfertas
  card_oferta.tsx                                       componente React — exporta: CardOferta
  controle_acesso_ofertas.tsx                           componente React — exporta: ModoAcessoOfertas, ControleAcessoOfertas
  grade_categorias_ofertas.tsx                          componente React — exporta: GradeCategoriasOfertas
  grade_todas_ofertas.tsx                               componente React — exporta: GradeTodasOfertas
  link_publico_ofertas.tsx                              componente React — exporta: LinkPublicoOfertas
  portao_acesso_ofertas.tsx                             componente React — exporta: PortaoAcessoOfertas
  secoes_por_categoria.tsx                              componente React — exporta: SecoesPorCategoria
  vitrine_ofertas.tsx                                   componente React — exporta: VitrineOfertas

src/features/ubiz_ofertas/hooks/
  hook_link_publico_ofertas.ts                          modulo TypeScript — exporta: useLinkPublicoOfertas
  hook_marca_ofertas.ts                                 modulo TypeScript — exporta: useMarcaOfertas
  hook_ofertas_publicas.ts                              modulo TypeScript — exporta: useOfertasPublicas

src/features/ubiz_ofertas/services/
  servico_ofertas_publicas.ts                           modulo TypeScript — exporta: buscarMarcaPorId, buscarBrandIdPorHostname, buscarOfertasAtivas, buscarCategoriasAtivas

src/features/ubiz_ofertas/services/__tests__/
  servico_ofertas_publicas.test.ts                      servico_ofertas_publicas — busca marca / oferta pública por hostname ou brand_id. Espelha resolveBrandByDomain do BrandContext. Bug aqui = hostname com 'www.' tenta primeiro o errado (perde primeira tentativa), subdomain

src/features/ubiz_ofertas/types/
  tipos_ofertas.ts                                      modulo TypeScript — exporta: OfertaPublica, CategoriaOferta, MarcaOfertas

src/features/ubiz_ofertas_admin/
  pagina_admin_ubiz_ofertas.tsx                         componente React — exporta: PaginaAdminUbizOfertas

src/features/ubiz_ofertas_admin/components/
  card_ubiz_ofertas_dashboard.tsx                       componente React — exporta: CardUbizOfertasDashboard
  secao_configuracao_ofertas.tsx                        componente React — exporta: SecaoConfiguracaoOfertas

src/features/ubiz_ofertas_admin/hooks/
  hook_configuracao_ubiz_ofertas.ts                     modulo TypeScript — exporta: ConfiguracaoUbizOfertas, useConfiguracaoUbizOfertas

src/hooks/
  hook_branch_city.ts                                   modulo TypeScript — exporta: useBranchCityName
  use-mobile.tsx                                        componente React — exporta: useIsMobile
  use-toast.ts                                          modulo TypeScript — exporta: reducer
  useAdminNotifications.ts                              modulo TypeScript — exporta: AdminNotification, useAdminNotifications
  useAppIcons.ts                                        modulo TypeScript — exporta: AppIconConfig, AppIconKey, useAppIcons
  useAutoSeedDemo.ts                                    modulo TypeScript — exporta: useAutoSeedDemo
  useBranchModules.ts                                   modulo TypeScript — exporta: BranchModuleKey, useBranchModules
  useBranchScoringModel.ts                              modulo TypeScript — exporta: ScoringModel, useBranchScoringModel
  useBrandGuard.ts                                      modulo TypeScript — exporta: useBrandGuard
  useBrandModules.ts                                    modulo TypeScript — exporta: useBrandModules
  useBrandName.ts                                       modulo TypeScript — exporta: useBrandName, useBrandInfo
  useBrandScoringModels.ts                              modulo TypeScript — exporta: ScoringModel, useBrandScoringModels
  useBrandTheme.ts                                      modulo TypeScript — exporta: BadgeConfig, BrandLayoutConfig, BrandTheme, useBrandTheme
  useConfirmDialog.ts                                   modulo TypeScript — exporta: useConfirmDialog
  useCustomerFavoriteStores.ts                          modulo TypeScript — exporta: useCustomerFavoriteStores
  useCustomerFavorites.ts                               modulo TypeScript — exporta: useCustomerFavorites
  useCustomerNotifications.ts                           modulo TypeScript — exporta: CustomerNotification, useCustomerNotifications
  useDebounce.ts                                        modulo TypeScript — exporta: useDebounce
  useDebouncedSearch.ts                                 modulo TypeScript — exporta: useDebouncedSearch
  useGanhaGanhaConfig.ts                                modulo TypeScript — exporta: GanhaGanhaConfig, useGanhaGanhaConfig
  useMenuLabels.ts                                      modulo TypeScript — exporta: LabelGroup, MenuLabelContext, getGroupsForTab, getContextForTab, useMenuLabels
  useMutationWithFeedback.ts                            modulo TypeScript — exporta: useMutationWithFeedback
  useOfferCardConfig.ts                                 modulo TypeScript — exporta: OfferTypeCardConfig, OfferCardConfig, DEFAULT_CONFIG, FormatData, useOfferCardConfig
  usePWA.ts                                             modulo TypeScript — exporta: usePWA
  usePermissions.ts                                     modulo TypeScript — exporta: usePermissions, ROLE_LABELS
  usePrefetchRoutes.ts                                  modulo TypeScript — exporta: usePrefetchRoutes
  usePullToRefresh.ts                                   modulo TypeScript — exporta: usePullToRefresh
  useRankedOffers.ts                                    modulo TypeScript — exporta: useRankedOffers
  useRedeemCelebration.ts                               modulo TypeScript — exporta: useRedeemCelebration
  useRedeemMutation.ts                                  Hook for confirming a redemption (marking as USED) in the store owner panel.
  useSidebarBadges.ts                                   modulo TypeScript — exporta: useSidebarBadges
  useStoreOwnerRedirect.ts                              modulo TypeScript — exporta: useStoreOwnerRedirect
  useStoreProfileCompleteness.ts                        modulo TypeScript — exporta: useStoreProfileCompleteness
  useTrackPageView.ts                                   useTrackPageView — dispara `$pageview` no PostHog quando o pathname muda. React Router não recarrega a página em SPA navigation. Sem este hook, só o page_view inicial seria capturado e todo o resto da sessão ficaria sem 

src/hooks/__tests__/
  small_hooks_batch_2.test.tsx                          Batch 2 de small hooks: hook_branch_city, useRankedOffers, useGanhaGanhaConfig, useBranchScoringModel, useRedeemCelebration.
  small_hooks_batch_3.test.tsx                          Batch 3: useBranchModules, useRedeemMutation, useCustomerFavorites, useCustomerFavoriteStores, useBrandName/useBrandInfo. Bug aqui = módulo desabilitado aparece em UI (orphan), resgate sem compra mínima passa (erro de re
  small_hooks_batch_4.test.tsx                          Batch 4: useStoreProfileCompleteness (pure), useBrandScoringModels, useStoreOwnerRedirect, useBrandModules. Bug aqui = % de completude errado, scoring agregado errado, store admin não vai pro panel certo, módulo aparece 
  small_hooks_batch_5.test.tsx                          Batch 5: useSidebarBadges, useAppIcons, useOfferCardConfig. Bug aqui = badges escondem aprovações pendentes, ícone customizado volta pro default, oferta mostra "R$ undefined" por template malformado.
  small_hooks_batch_6.test.tsx                          Batch 6: useCustomerNotifications + useAdminNotifications. Bug aqui = notificações nunca aparecem ou unreadCount fica errado, markAsRead não persiste, realtime não conecta.
  use-mobile.test.tsx                                   useIsMobile — detecta viewport mobile (< 768px) via matchMedia + resize. Bug aqui = SSR crash (sem window), breakpoint inconsistente entre SSR e client (hydration mismatch), listener vaza após unmount.
  use-toast.test.ts                                     use-toast — toast manager singleton (shadcn pattern). Reducer puro testado direto + comportamento de `toast()` factory (singleton listener pattern). Bug aqui: - Toast aparece e some imediatamente (TOAST_LIMIT errado) - M
  useAutoSeedDemo.test.tsx                              useAutoSeedDemo — auto-seed de demo stores no primeiro acesso do customer se brand não tem taxonomy linked. Bug aqui = seed dispara sempre (waste), ou não dispara nunca (UX vazia em demo), ou flag não persiste (re-seed e
  useBrandGuard.test.tsx                                useBrandGuard — central de permissioning multi-tenant. Bug aqui = vazamento cross-tenant. 109 componentes consomem este hook pra decidir queries, filtros, e enforcement de brand_id/branch_id em inserts/updates. Testes co
  useBrandTheme.test.tsx                                useBrandTheme — aplica CSS vars + Google Fonts + favicon + dynamic PWA manifest do brand. Bug aqui = brand color vaza em dark mode, Blob de manifest vaza em troca de brand, fonts não carregam.
  useConfirmDialog.test.tsx                             useConfirmDialog — controla state do AlertDialog de confirmação. Bug aqui = "tem certeza?" abre sem callback (botão confirm não faz nada), ou state preserva info antiga ao reabrir (mensagem errada).
  useDebounce.test.tsx                                  useDebounce + useDebouncedSearch — debounce de input + pagination reset. Bug aqui = busca atrasada/perdida, ou page não reseta ao trocar busca (admin vê resultado vazio).
  useMenuLabels.test.tsx                                useMenuLabels — labels customizáveis por brand (white-label). Bug aqui = label custom não aparece (cache miss), fallback errado pra key desconhecida, query disparada sem brandId.
  useMutationWithFeedback.test.tsx                      useMutationWithFeedback — wrapper de useMutation com toast + haptics. Bug aqui = mutation sucede mas usuário não tem feedback (toast/haptic), ou erro mostra mensagem genérica em vez de error.message detalhado.
  usePWA.test.tsx                                       usePWA — install prompt + SW update lifecycle. Bug aqui = install banner não aparece após elegível, SW update não dispara needRefresh, dismissInstall não esconde.
  usePermissions.test.tsx                               usePermissions — checks de RBAC client-side baseado em roles. Bug aqui = vazamento de tenant (brand_admin de brand A acessa brand B) ou bloqueio incorreto de root_admin. Usa o mock harness consolidado de createMockAuth (
  usePrefetchRoutes.test.tsx                            usePrefetchRoutes — prefetch agressivo de queries comuns na área do cliente. Bug aqui = navegação lenta entre tabs (Wallet, Ofertas, Resgates) por falta de cache pré-carregado. Cobre: - Não dispara sem brandId/branchId -
  usePullToRefresh.test.tsx                             usePullToRefresh — gesto de touch pra recarregar página em mobile. Bug aqui = gesto trigger sem chegar no threshold, refresh trava, scroll > 0 disparando incorretamente. Testa via wrapper component porque useEffect preci
  useTrackPageView.test.tsx                             useTrackPageView — dispara $pageview no PostHog em SPA navigation. Bug aqui = analytics perde nav entre rotas (admin acha que usuários só ficam na primeira página).

src/integrations/supabase/
  client.ts                                             This file is automatically generated. Do not edit it directly.
  types.ts                                              modulo TypeScript — exporta: Json, Database, Tables, TablesInsert, TablesUpdate, Enums

src/lib/
  analytics.ts                                          analytics.ts — wrapper minimal pra PostHog (event tracking de produto). Princípios: 1. Graceful degradation: se VITE_POSTHOG_KEY não estiver setado, todas as funções viram no-op. Não quebra dev sem env config. 2. Lazy in
  apiResponse.ts                                        API Response — helpers client-side para parsing consistente de Edge Functions. Padrão esperado das Edge Functions: { ok: boolean, data?: T, error?: string, code?: string }
  auditLogger.ts                                        Client-side audit logger for critical actions. Logs to the audit_logs table via Supabase client. Otimizações pós-diagnóstico de boot lento (sessão 2026-05-16): - Deferred via requestIdleCallback: não bloqueia caminho crí
  bootContext.ts                                        Boot context: dispara UMA RPC `get_boot_context` no início do app, antes do React montar. Os contexts (Auth, Brand) consomem o resultado em vez de fazer 5-7 queries paralelas (que iOS Safari aborta em 5G). Estratégia: - 
  bootMetrics.ts                                        Boot metrics: usa Performance API pra cronometrar as etapas do boot. Logs aparecem no console com tempo desde o início — essencial pra diagnosticar onde o boot está travando em 5G/iOS Safari. Como ler: [boot] boot:rpc-st
  bootMonitoring.ts                                     Decide e dispara o carregamento de Sentry + web-vitals. Em rotas /webview o modo "lite" pula tudo para acelerar in-app browsers. Extraído de main.tsx para permitir testes automatizados.
  bootState.ts                                          Re-exports core boot state + React hook. Components that need useBootReady import from here. main.tsx should import from bootStateCore instead.
  bootStateCore.ts                                      Core boot-state machine — zero React dependency. Safe to import from main.tsx and other non-React modules.
  categorizadorAchadinhos.ts                            Motor de categorização automática de Achadinhos (client-side). Porta da lógica do mirror-sync edge function para uso na importação.
  dateTz.ts                                             Helpers de data com timezone explícito. MOTIVO (auditoria de BI): código usava `new Date().toISOString()` que converte hora LOCAL pra UTC, causando bugs em billing e limits diários: - Brasil = UTC-3 - 23h Brasil = 02h UT
  errorTracker.ts                                       Lightweight error tracking module. Captures unhandled errors and persists them to the error_logs table. Otimizações pós-diagnóstico de boot lento (sessão 2026-05-16): - Deduplicação: mesma message em janela de 5s = 1 POS
  eventBus.ts                                           Event Bus leve e tipado para comunicação entre módulos. Todos os handlers executam em microtask (não-bloqueante).
  eventBusQueryBridge.ts                                Event Bus → React Query Bridge Escuta eventos do eventBus e invalida queries automaticamente. Inicialize uma vez no App: import { initEventBusQueryBridge } from "@/lib/eventBusQueryBridge"; initEventBusQueryBridge(queryC
  formatPoints.ts                                       modulo TypeScript — exporta: formatPoints
  formatters.ts                                         Formatadores centralizados — consolida 9+ implementações inline de formatPrice/formatCurrency espalhadas pelo codebase (auditoria arquitetural identificou inconsistências: alguns retornam null em 0, outros mostram "R$ 0,
  ganhaGanhaBilling.ts                                  modulo TypeScript — exporta: recordGanhaGanhaBillingEvent
  geolocation.ts                                        modulo TypeScript — exporta: Coords, getCurrentPosition, distanceKm
  handleAsync.ts                                        modulo TypeScript — exporta: handleAsync
  haptics.ts                                            Feedback háptico para dispositivos móveis. Usa optional chaining — seguro em dispositivos sem suporte.
  helpContent.ts                                        Conteúdo de ajuda contextual para cada rota/funcionalidade do sistema. Cada entrada contém título, descrição resumida e passos didáticos.
  imageUtils.ts                                         Otimiza URLs de imagens do Supabase Storage usando query params de transformação. Para URLs não-Supabase, retorna a URL original sem modificação.
  lazyPages.ts                                          Mapa centralizado de páginas lazy-loaded. Importar daqui em App.tsx (e em route-blocks) evita inflar o entrypoint principal e mantém um único lugar para registrar/renomear páginas.
  lazyWithRetry.ts                                      modulo TypeScript — exporta: lazyWithRetry, isChunkLoadError, loadWithRetry
  logger.ts                                             Módulo de logging centralizado com métricas, timers e alertas. Uso: import { createLogger } from "@/lib/logger"; const log = createLogger("crm"); log.info("Contato criado", { id: "..." }); log.error("Falha ao buscar cont
  openLink.ts                                           modulo TypeScript — exporta: OpenLinkOptions, openLink, trackClick
  publicShareUrl.ts                                     modulo TypeScript — exporta: getPublicOrigin, getPublicOriginSync, resolveCanonicalOriginFromSettings, buildDriverUrl, buildDriverShortUrl, buildWebviewWrapperUrl
  pwaRecovery.ts                                        modulo TypeScript — exporta: clearRuntimeCaches, recoverFromChunkError, isRecoverableDomError, canAttemptRecovery, installGlobalDomErrorRecovery
  queryClient.ts                                        QueryClient centralizado com configuração otimizada para escalabilidade. - staleTime global de 30s para dados operacionais - gcTime de 10min para liberar memória - Retry com backoff exponencial (max 2 retries) - refetchO
  queryKeys.ts                                          Query Key Factory — chaves tipadas por módulo para invalidação precisa. Uso: // Invalida TODAS as queries de um módulo (prefix match): queryClient.invalidateQueries({ queryKey: queryKeys.crm.contacts.all }) // Query espe
  radixPointerEventsFix.ts                              Fix global para um bug conhecido do Radix UI (Dialog, Popover, AlertDialog, DropdownMenu) onde, ao fechar dois overlays em sequência rápida, o `pointer-events: none` aplicado ao <body> não é removido — travando todo o ap
  routeConditions.ts                                    Funções puras de roteamento — usadas por App.tsx para decidir qual árvore de rotas renderizar (admin, white-label, public, fast-track). Mantenha estes helpers PUROS e sincronos: a árvore deve poder ser decidida antes de 
  routeDiagnostics.ts                                   Relatório de erros/estágios por rota. Cada rota crítica chama `trackStage(route, stage, status, detail?)` em pontos-chave (auth, brand, driver, loader, render). Os eventos ficam em memória e podem ser inspecionados via `
  routePrefetch.ts                                      Mapa de path → dynamic import para prefetch on hover de rotas. Funcionamento: `NavLink` chama `prefetchRoute(to)` em onMouseEnter/onFocus. Se houver entry no mapa, dispara o `import()` em background. Quando o usuário cli
  safeStorage.ts                                        Wrappers seguros para localStorage/sessionStorage. Em Safari Private Mode ou navegadores com storage desabilitado, as APIs nativas lançam exceção; estas funções engolem o erro e retornam fallback.
  sanitize.ts                                           Input sanitization utilities for XSS prevention and input validation.
  sendRedemptionTelegram.ts                             modulo TypeScript — exporta: sendRedemptionTelegramNotification
  sentry.ts                                             modulo TypeScript — exporta: initSentry
  tierUtils.ts                                          Tier classification based on ride count.
  translateError.ts                                     modulo TypeScript — exporta: translateError
  utils.ts                                              modulo TypeScript — exporta: cn, hslToCss, withAlpha, brandAlpha
  webVitals.ts                                          Web Vitals monitoring — captura métricas de performance e envia ao Sentry como breadcrumbs. Métricas: LCP, FID, FCP, CLS, TTFB, INP

src/lib/__tests__/
  analytics.test.ts                                     analytics — wrapper PostHog com graceful degradation + lazy init. Bug aqui = perda de eventos de produto (NPS quebrado), OU bundle inflado por carregar PostHog SDK no SSR, OU erro de PostHog quebrando boot. Testa: - init
  apiResponse.test.ts                                   suite de testes
  auditLogger.test.ts                                   auditLogger — fire-and-forget de audit_logs. Bug aqui: - Crítico: jamais propagar falhas (cascata de error_logs vista no boot lento de iOS). Engole TUDO. - Caminho do login: precisa ser deferido via requestIdleCallback p
  bootContext.test.ts                                   bootContext — fast-path de boot que dispara `get_boot_context` RPC ANTES de React montar. Contexts (Auth, Brand) consomem o resultado em vez de fazer 5-7 queries paralelas (iOS Safari aborta em 5G). Bug aqui = boot lento
  bootMetrics.test.ts                                   bootMetrics — instrumentação Performance API do boot. Bug aqui = perda do sinal de diagnóstico (não dá pra investigar boots lentos), ou marca duplicada poluindo trace.
  bootMonitoring.test.ts                                suite de testes
  bootState.test.tsx                                    bootState — re-exports do bootStateCore + hook useBootReady (useSyncExternalStore). IMPORTANTE: bootResolved é state SINGLETON STICKY do módulo — uma vez que vira true (BRAND_READY ou FAILED), nunca mais reverte (proteçã
  bootStateCore.test.ts                                 bootStateCore — state machine de boot SEM dependência React. Bug aqui = loader infinito ou loader fica preso em fase antiga. Importante: - Monotônico (não regride): se BrandContext skip-local chega a BRAND_READY antes do
  categorizadorAchadinhos.test.ts                       categorizadorAchadinhos — categorização automática de produtos. Usado na importação/mirror-sync pra mapear deals externos pra categorias internas do brand. Bug aqui = produtos categorizados errado → analytics quebrado, "
  dateTz.test.ts                                        dateTz — TZ-aware ISO conversions pra billing mensal + queries de range por data local. Bug aqui = billing event no mês errado às 23h dia 31 (UTC vira mês seguinte), report query pega 21-23h do dia anterior.
  errorTracker.test.ts                                  Error tracker unit tests.
  eventBus.test.ts                                      eventBus — pub/sub leve com handlers em microtask. Bug aqui = invalidações de query não disparam (cache stale após mutation) OU handler que falha derruba outros handlers.
  eventBusQueryBridge.test.ts                           eventBusQueryBridge — escuta eventos do eventBus e invalida queries automaticamente. Bug aqui = mutations não refletem em listas (cache stale) ou invalidação cega que limpa demais.
  formatPoints.test.ts                                  formatPoints — formatter pt-BR usado em ~100 sites na UI de pontos. Bug aqui = saldo mostrado errado (mil viraria 1.000 ou 1,000 dependendo do locale). Test garante separador de milhar correto.
  formatters.test.ts                                    suite de testes
  ganhaGanhaBilling.test.ts                             ganhaGanhaBilling — registra evento de cobrança após earn/redeem. Bug aqui = receita errada. Particularmente: - Brand sem ganha_ganha_config: deveria não-cobrar; bug = cobra - fee_mode CUSTOM: deveria usar fee por store;
  geolocation.test.ts                                   geolocation — getCurrentPosition wrapper (graceful sem geo) + distanceKm (haversine) usado em findNearestBranch e auto-detect de filial. Bug aqui = browser sem geo crasha (getCurrentPosition em null), haversine retorna N
  handleAsync.test.ts                                   handleAsync — wrapper de async com error log + onError + rethrow opcional. Bug aqui = exception engolida sem log (debug impossível), onError não chamado, non-Error thrown vira string ruim.
  haptics.test.ts                                       haptics — feedback tátil via navigator.vibrate. Bug aqui = vibrate crasha em desktop sem suporte (sem ?), pattern de sucesso virá errado se mexer no array (UX confusa).
  imageUtils.test.ts                                    imageUtils — transforma URLs do Supabase Storage com query params de resize. Bug aqui = aplica transform em URL externa (CDN externa quebra), separator errado vira "?width=&?width=" (URL inválida), preset omite quality.
  lazyWithRetry.test.ts                                 lazyWithRetry — wrapper React.lazy com 2 retries antes de PWA recovery. Por que importa: iOS Safari em 5G/3G aborta dynamic imports com erro genérico "Importing a module script failed" — mas o chunk EXISTE, fica disponív
  logger.test.ts                                        logger — logging centralizado com ring buffer, métricas e alertas. Bug aqui: - Logs perdidos (debug em prod silenciado por engano) - Métricas erradas (errorCount/warnCount inflados ou subcontados) - Alert callback cascad
  openLink.test.ts                                      openLink — abertura central de links com tracking + WEBVIEW vs REDIRECT. Bug aqui: - Tracking não registrado (analytics quebrada) - URL externa abrindo no mesmo tab (perde sessão) - URL interna abre webview (degrada perf
  publicShareUrl.test.ts                                publicShareUrl — resolução de origin canônico + builders de URLs públicas. Bug aqui: - Links de motorista quebrados (compartilhamento por WhatsApp) - Cache stale (admin muda domain mas link continua antigo) - URL com dou
  pwaRecovery.test.ts                                   pwaRecovery — recovery global de chunk errors + DOM dessincronizado. Bug aqui = boot loops (reload em loop), recovery não dispara em cenários reais, OU recovery dispara em dev quando deveria ser HMR simples. Cobre as fun
  queryClient.test.ts                                   queryClient — config global do TanStack React Query. Bug aqui = staleTime baixo demais (refetch agressivo, latência), retry infinito em erro permanente, refetchOnWindowFocus traz dados velhos silenciosamente.
  queryKeys.test.ts                                     suite de testes
  radixPointerEventsFix.test.ts                         radixPointerEventsFix — fix global pro bug de Radix UI travar o app com pointer-events: none no body após fechar 2 overlays rápido. Bug aqui = app travado (clicks param de funcionar) sem o fix, OU remoção incorreta da pr
  rlsCrossTenant.test.ts                                RLS Cross-Tenant Security Tests Validates that Supabase RLS policies enforce proper tenant isolation. Tests cover: - brand_id scoped tables cannot be read cross-tenant - INSERT/UPDATE/DELETE cross-brand are rejected - Sa
  rlsPenetration.test.ts                                RLS Penetration Tests — Simulated cross-user data access attempts. These tests verify that Supabase client queries scoped to one user cannot return data belonging to another user. NOTE: These are structural tests that va
  routeConditions.test.ts                               suite de testes
  routeDiagnostics.test.ts                              routeDiagnostics — telemetria in-memory por rota crítica. Bug aqui = perda de sinal pra diagnosticar boots travados ("/motorista/ campeonato fica em branco" sem console error).
  safeStorage.test.ts                                   safeStorage — wrappers seguros pra localStorage/sessionStorage. Bug aqui = exception em Safari Private Mode quebra app inteiro, setItem com quota exceeded propaga, sessionStorage tratado igual a localStorage (perde isola
  sanitize.test.ts                                      suite de testes
  sendRedemptionTelegram.test.ts                        sendRedemptionTelegram — disparo opcional de notificação Telegram após resgate. Bug aqui = falha de Telegram bloqueia checkout (UX morta) ou notif disparada pra brand sem config (waste).
  sentry.test.ts                                        sentry — initSentry só roda em PROD com DSN configurado. Bug aqui = init em dev mode mata performance (replay overhead), sem DSN tenta init silencioso e crasha, ignoreErrors esquece de Safari quirks (ResizeObserver) e en
  tierUtils.test.ts                                     tierUtils — classificação de tier por contagem de corridas. Bug aqui = boundary errado (10 vai pra PRATA em vez de BRONZE), tier desconhecido sem fallback (crash em label), threshold mismatch com Supabase RPC.
  translateError.test.ts                                suite de testes
  utils.test.ts                                         lib/utils — cn (classnames merge), hslToCss (dark mode aware), withAlpha, brandAlpha (hex/hsl/var safe). Bug aqui = brand color vaza em dark mode, alpha quebra em CSS vars, hex color malformado.
  webVitals.test.ts                                     webVitals — reporta Web Vitals (LCP, FID, FCP, CLS, TTFB, INP) ao Sentry como breadcrumbs. Bug aqui = rating ausente vira "error" no Sentry (alerta falso), value não arredondado polui breadcrumbs com decimal ruidoso.

src/lib/api/
  mirrorSync.ts                                         modulo TypeScript — exporta: SourceCatalogEntry, fetchSourceCatalog, updateSourceCatalogEntry, triggerMirrorSync, runMirrorDiagnose, fetchSyncLogs
  offerGovernance.ts                                    modulo TypeScript — exporta: SourceSystem, ORIGENS, STATUS_LABELS, REPORT_STATUS_LABELS, fetchGovernanceKpis, GovernanceDealFilters

src/lib/api/__tests__/
  mirrorSync.integration.test.ts                        suite de testes
  mirrorSync.test.ts                                    mirrorSync — API de sync de mirror sources (DVLinks, Divulgador Inteligente). Bug aqui: - Conector criado sem brand_id (orphan record) - Delete sem archiveDeals deixa deals fantasma (origin sem connector) - upsert duplic
  offerGovernance.test.ts                               offerGovernance — governança de ofertas afiliadas (sync/reports/bulk). Bug aqui: - KPIs errados (admin vê números de outra brand) - Bulk actions sem filtro de brand_id (cross-tenant damage) - Auto-hide threshold quebrado

src/modules/auth/
  compat.ts                                             modulo TypeScript
  index.ts                                              Auth Module — barrel export.
  types.ts                                              Auth Module — tipos e constantes compartilhados.

src/modules/auth/__tests__/
  auth.test.ts                                          suite de testes
  authFlow.test.ts                                      Service-layer test: Auth module types and role resolution.

src/modules/customers/
  index.ts                                              Customers Module — barrel export.
  types.ts                                              Customers Module — types & business logic.

src/modules/customers/__tests__/
  customerService.test.ts                               customerService — data access pra customers (list/create/update/findOrCreate). Bug aqui = update sem WHERE brand_id permite edição cross-tenant (RLS é defense-in-depth), search escape errado vira SQL injection, findOrCre
  customers.test.ts                                     suite de testes

src/modules/customers/services/
  customerService.ts                                    Customer Service — data access layer.

src/modules/loyalty/
  index.ts                                              Loyalty Module — barrel export.
  schemas.ts                                            Loyalty Module — Zod validation schemas.
  types.ts                                              Loyalty Module — tipos e constantes.

src/modules/loyalty/__tests__/
  earning.test.ts                                       suite de testes
  earningFlow.test.ts                                   Service-layer integration test: Earning flow. Tests earningService daily limits, receipt uniqueness.
  earningService.test.ts                                Earning Service unit tests. Tests calculateEarning, clampStorePointsPerReal, and service functions.
  redemptionFlow.test.ts                                Service-layer integration test: Redemption flow. Tests the redemptionService logic without UI.
  redemptionService.test.ts                             suite de testes
  schemas.test.ts                                       suite de testes

src/modules/loyalty/services/
  earningService.ts                                     Loyalty Service — camada de acesso a dados para pontuação e resgates.
  redemptionService.ts                                  Loyalty Service — resgates.

src/modules/stores/
  index.ts                                              Stores Module — barrel export.
  types.ts                                              Stores Module — tipos e constantes.

src/modules/stores/__tests__/
  storeService.test.ts                                  storeService — data access pra parceiros (fetch/fetchById/updateApproval). Bug aqui = filtro brand_id ignorado vaza stores de outro tenant, search escape errado, approval status sem validação ainda chega ao DB.
  storeTypes.test.ts                                    suite de testes

src/modules/stores/services/
  storeService.ts                                       Stores Service — camada de acesso a dados para parceiros.

src/modules/vouchers/
  index.ts                                              Vouchers Module — barrel export.
  schemas.ts                                            Vouchers Module — Zod validation schemas.
  types.ts                                              Vouchers Module — types & business logic.

src/modules/vouchers/__tests__/
  schemas.test.ts                                       suite de testes
  voucherService.test.ts                                Integration tests for Voucher Service.
  vouchers.test.ts                                      suite de testes

src/modules/vouchers/services/
  voucherService.ts                                     Voucher Service — data access layer.

src/pages/
  AccessHubPage.tsx                                     componente React — exporta: AccessHubPage
  AchadinhosMobileImportPage.tsx                        componente React — exporta: AchadinhosMobileImportPage
  AffiliateCategoriesPage.tsx                           componente React — exporta: AffiliateCategoriesPage
  AffiliateDealsPage.tsx                                componente React — exporta: AffiliateDealsPage
  ApiDocsPage.tsx                                       componente React — exporta: ApiDocsPage
  AppIconsConfigPage.tsx                                componente React — exporta: AppIconsConfigPage
  ApproveStoreRulesPage.tsx                             componente React — exporta: ApproveStoreRulesPage
  AuditLogsPage.tsx                                     componente React — exporta: AuditLogsPage
  Auth.tsx                                              componente React — exporta: Auth
  BannerManagerPage.tsx                                 componente React — exporta: BannerManagerPage
  BranchForm.tsx                                        componente React — exporta: BranchForm
  BranchReportsPage.tsx                                 componente React — exporta: BranchReportsPage
  BranchWalletPage.tsx                                  componente React — exporta: BranchWalletPage
  Branches.tsx                                          componente React — exporta: Branches
  BrandApiJourneyPage.tsx                               componente React — exporta: BrandApiJourneyPage
  BrandApiKeysPage.tsx                                  componente React — exporta: BrandApiKeysPage
  BrandBranchForm.tsx                                   componente React — exporta: BrandBranchForm
  BrandBranchesPage.tsx                                 componente React — exporta: BrandBranchesPage
  BrandCidadesJourneyPage.tsx                           componente React — exporta: BrandCidadesJourneyPage
  BrandDomains.tsx                                      componente React — exporta: BrandDomains
  BrandForm.tsx                                         componente React — exporta: BrandForm
  BrandJourneyGuidePage.tsx                             componente React — exporta: BrandJourneyGuidePage
  BrandModulesPage.tsx                                  componente React — exporta: BrandModulesPage
  BrandPermissionOverflowPage.tsx                       componente React — exporta: BrandPermissionOverflowPage
  BrandSettingsPage.tsx                                 componente React — exporta: BrandSettingsPage
  Brands.tsx                                            componente React — exporta: Brands
  CloneBranchPage.tsx                                   componente React — exporta: CloneBranchPage
  CrmEmbedPage.tsx                                      componente React — exporta: CrmEmbedPage
  CsvImportPage.tsx                                     componente React — exporta: CsvImportPage
  CustomerPreviewPage.tsx                               componente React — exporta: CustomerPreviewPage
  CustomersPage.tsx                                     componente React — exporta: CustomersPage
  Dashboard.tsx                                         componente React — exporta: Dashboard
  DriverManagementPage.tsx                              componente React — exporta: DriverManagementPage
  DriverPanelConfigPage.tsx                             componente React — exporta: DriverPanelConfigPage
  DriverPanelPage.tsx                                   componente React — exporta: DriverPanelPage
  DriverPointsRulesPage.tsx                             componente React — exporta: DriverPointsRulesPage
  EarnPointsPage.tsx                                    componente React — exporta: EarnPointsPage
  EmitterJourneyGuidePage.tsx                           componente React — exporta: EmitterJourneyGuidePage
  EmitterRequestsPage.tsx                               componente React — exporta: EmitterRequestsPage
  FeatureFlagsPage.tsx                                  componente React — exporta: FeatureFlagsPage
  GanhaGanhaBillingPage.tsx                             componente React — exporta: GanhaGanhaBillingPage
  GanhaGanhaClosingReportsPage.tsx                      componente React — exporta: GanhaGanhaClosingReportsPage
  GanhaGanhaConfigPage.tsx                              componente React — exporta: GanhaGanhaConfigPage
  GanhaGanhaReportsPage.tsx                             GanhaGanhaReportsPage — Sub-fase 5.8 ------------------------------------ Hub de Relatórios Cashback para root + brand_admin. Filtros de período + breakdowns por loja/cidade/mês + export CSV/PDF. Gateado por business_mod
  GanhaGanhaRootDashboardPage.tsx                       componente React — exporta: GanhaGanhaRootDashboardPage
  GanhaGanhaStoreSummaryPage.tsx                        componente React — exporta: GanhaGanhaStoreSummaryPage
  HomeTemplatesPage.tsx                                 componente React — exporta: HomeTemplatesPage
  IconLibraryPage.tsx                                   componente React — exporta: IconLibraryPage
  InstallPwaPage.tsx                                    componente React — exporta: InstallPwaPage
  LandingPage.tsx                                       componente React — exporta: LandingPage
  MachineIntegrationPage.tsx                            componente React — exporta: MachineIntegrationPage
  MachineWebhookTestPage.tsx                            componente React — exporta: MachineWebhookTestPage
  ManuaisPage.tsx                                       componente React — exporta: ManuaisPage
  McpDashboardPage.tsx                                  componente React — exporta: McpDashboardPage
  MenuLabelsPage.tsx                                    componente React — exporta: MenuLabelsPage
  MirrorSyncPage.tsx                                    componente React — exporta: MirrorSyncPage
  ModuleDefinitionsPage.tsx                             componente React — exporta: ModuleDefinitionsPage
  NotFound.tsx                                          componente React — exporta: NotFound
  OfferCardConfigPage.tsx                               componente React — exporta: OfferCardConfigPage
  OfferGovernancePage.tsx                               componente React — exporta: OfferGovernancePage
  OffersPage.tsx                                        componente React — exporta: OffersPage
  OperatorRedeemPage.tsx                                componente React — exporta: OperatorRedeemPage
  PageBuilderPage.tsx                                   componente React — exporta: PageBuilderPage
  PageBuilderV2Page.tsx                                 componente React — exporta: PageBuilderV2Page
  PaginaDominiosMarca.tsx                               componente React — exporta: PaginaDominiosMarca
  PartnerLandingConfigPage.tsx                          componente React — exporta: PartnerLandingConfigPage
  PartnerLandingPage.tsx                                componente React — exporta: PartnerLandingPage
  PermissionsPage.tsx                                   componente React — exporta: PermissionsPage
  PlanModuleTemplatesPage.tsx                           componente React — exporta: PlanModuleTemplatesPage
  PlatformThemePage.tsx                                 componente React — exporta: PlatformThemePage
  PointsLedgerPage.tsx                                  componente React — exporta: PointsLedgerPage
  PointsRulesPage.tsx                                   componente React — exporta: PointsRulesPage
  ProductRedemptionOrdersPage.tsx                       componente React — exporta: ProductRedemptionOrdersPage
  ProdutosResgatePage.tsx                               componente React — exporta: ProdutosResgatePage
  ProfileLinksConfigPage.tsx                            componente React — exporta: ProfileMenuItem, ProfileLinksConfigPage
  ProvisionBrandWizard.tsx                              componente React — exporta: ProvisionBrandWizard
  PublicVouchers.tsx                                    componente React — exporta: PublicVouchers
  RedemptionsPage.tsx                                   componente React — exporta: RedemptionsPage
  RegrasResgatePage.tsx                                 componente React — exporta: RegrasResgatePage
  ReleasesPage.tsx                                      componente React — exporta: ReleasesPage
  ReportsPage.tsx                                       componente React — exporta: ReportsPage
  ResetPassword.tsx                                     componente React — exporta: ResetPassword
  RootJourneyGuidePage.tsx                              componente React — exporta: RootJourneyGuidePage
  SectionTemplatesPage.tsx                              componente React — exporta: SectionTemplatesPage
  SendNotificationPage.tsx                              componente React — exporta: SendNotificationPage
  SponsoredPlacementsPage.tsx                           componente React — exporta: SponsoredPlacementsPage
  StarterKitConfigPage.tsx                              componente React — exporta: StarterKitConfigPage
  StoreCatalogPage.tsx                                  componente React — exporta: StoreCatalogPage
  StoreGanhaGanhaPage.tsx                               StoreGanhaGanhaPage — Sub-fase 5.8 ---------------------------------- Visão de auto-serviço da loja parceira (store_admin). Filtros simples + KPIs + tabela mensal + export CSV.
  StoreOwnerPanel.tsx                                   componente React — exporta: StoreOwnerPanel
  StorePointsRulePage.tsx                               componente React — exporta: StorePointsRulePage
  StoreRegistrationWizard.tsx                           componente React — exporta: StoreRegistrationWizard
  StoresPage.tsx                                        componente React — exporta: StoresPage
  SubscriptionPage.tsx                                  componente React — exporta: SubscriptionPage
  TaxonomyPage.tsx                                      componente React — exporta: TaxonomyPage
  TenantForm.tsx                                        componente React — exporta: TenantForm
  Tenants.tsx                                           componente React — exporta: Tenants
  TierPointsRulesPage.tsx                               componente React — exporta: TierPointsRulesPage
  TrialSignupPage.tsx                                   componente React — exporta: TrialSignupPage
  UsersPage.tsx                                         componente React — exporta: UsersPage
  VoucherForm.tsx                                       componente React — exporta: VoucherForm
  VoucherRedeem.tsx                                     Voucher Redeem Page
  VoucherWizardPage.tsx                                 componente React — exporta: VoucherWizardPage
  Vouchers.tsx                                          componente React — exporta: Vouchers
  WelcomeTourConfigPage.tsx                             componente React — exporta: WelcomeTourConfigPage

src/pages/__tests__/
  Auth.test.tsx                                         suite de testes
  AuthFlow.e2e.test.tsx                                 E2E Integration Tests — Auth Flow Tests: login, signup, password reset, role-based redirect
  OffersFlow.e2e.test.tsx                               E2E Integration Tests — Offer CRUD Flow Tests: create, edit, delete offers
  RedemptionsFlow.e2e.test.tsx                          E2E Integration Tests — Redemptions Flow Tests: list redemptions, search, pagination, status display
  StoresFlow.e2e.test.tsx                               E2E Integration Tests — Stores CRUD Flow Tests: list stores, create dialog, status display, approval tabs

src/pages/branches/components/
  CardPontuacaoMotorista.tsx                            componente React — exporta: ModoRegra, FaixaVolume, PontuacaoMotoristaState, PONTUACAO_MOTORISTA_PADRAO, CardPontuacaoMotorista

src/pages/conversao_resgate/
  pagina_conversao_resgate.tsx                          componente React — exporta: PaginaConversaoResgate

src/pages/customer/
  CustomPage.tsx                                        componente React — exporta: CustomPage
  CustomerAuthPage.tsx                                  componente React — exporta: CustomerAuthPage
  CustomerDriverDashboardPage.tsx                       componente React — exporta: CustomerDriverDashboardPage
  CustomerEmissorasPage.tsx                             componente React — exporta: CustomerEmissorasPage
  CustomerHomePage.tsx                                  componente React — exporta: CustomerHomePage
  CustomerOfferDetailPage.tsx                           componente React — exporta: CustomerOfferDetailPage
  CustomerOffersPage.tsx                                componente React — exporta: CustomerOffersPage
  CustomerProfilePage.tsx                               componente React — exporta: CustomerProfilePage
  CustomerRedemptionDetailPage.tsx                      componente React — exporta: CustomerRedemptionDetailPage
  CustomerRedemptionsPage.tsx                           componente React — exporta: CustomerRedemptionsPage
  CustomerStoreDetailPage.tsx                           componente React — exporta: CustomerStoreDetailPage
  CustomerWalletPage.tsx                                componente React — exporta: CustomerWalletPage
  WebviewPage.tsx                                       componente React — exporta: WebviewPage

src/pages/produtos_resgate/components/
  BotaoRecalcularPontos.tsx                             componente React — exporta: BotaoRecalcularPontos
  ModalAdicionarResgatavel.tsx                          componente React — exporta: ModalAdicionarResgatavel
  ModalCriarProdutoManual.tsx                           componente React — exporta: ModalCriarProdutoManual
  ModalEditarResgatavel.tsx                             componente React — exporta: ModalEditarResgatavel

src/routes/
  AnimatedRoutes.tsx                                    componente React — exporta: AnimatedRoutes
  OfertasFastTrack.tsx                                  componente React — exporta: OfertasFastTrack
  PageLoader.tsx                                        componente React — exporta: PageLoader

src/test/
  example.test.ts                                       suite de testes
  setup.ts                                              modulo TypeScript — exporta: MockQueryResult, createMockQueryBuilder, createMockSupabase

src/test/mocks/
  context.ts                                            Mock factories pra contexts/hooks usados por componentes de teste. Padrão: cada factory expõe um state mutável (defaults razoáveis) + funções que leem do state. Testes podem mutar pra simular cenários sem recriar mocks d

src/test/mocks/__tests__/
  context.test.ts                                       Smoke tests do mock harness consolidado. Verifica que defaults + overrides + reset funcionam como anunciado no JSDoc do módulo.

src/types/
  customer.ts                                           Shared types for customer-facing pages.
  driver.ts                                             Tipos compartilhados para o módulo de motoristas.
  driver_profile.ts                                     Tipagem do perfil estendido do motorista (driver_profiles). Mapeia 1:1 a tabela do banco — todos os campos são opcionais por design.
```

### Backend — `supabase/functions/`

```text

supabase/functions/_shared/
  edgeLogger.ts                                         Structured JSON logger for Edge Functions. Outputs JSON to stdout for easy parsing in production.
  email.ts                                              Helper genérico de envio de email via Resend. Extraído de otpHelpers.ts pra que múltiplos contextos (OTP, trial reminders, futuros transactional emails) reusem o mesmo provider sem duplicar lógica de fallback / auth head
  fetchRideData.ts                                      Dual-endpoint TaxiMachine ride data fetcher. Tries the Recibo endpoint first, falls back to Request V1. If Recibo succeeds but lacks passenger phone, enriches from V1. IMPORTANT: Recibo endpoint requires MATRIX (headquar
  otpHelpers.ts                                         Helpers compartilhados entre send-otp-code e verify-otp-code. Substitui geração client-side (CRÍTICO de segurança da auditoria).
  rateLimiter.ts                                        Database-backed sliding window rate limiter for Edge Functions. Usage: import { checkRateLimit } from "../_shared/rateLimiter.ts"; const rl = await checkRateLimit(supabaseAdmin, identifier, { maxRequests: 60, windowSecon

supabase/functions/admin-brand-actions/
  index.ts                                              modulo TypeScript

supabase/functions/agent-api/
  index.ts                                              modulo TypeScript

supabase/functions/apply-plan-template/
  index.ts                                              modulo TypeScript

supabase/functions/check-expiring-favorites/
  index.ts                                              modulo TypeScript

supabase/functions/check-onboarding-alerts/
  index.ts                                              modulo TypeScript

supabase/functions/create-branch-admin/
  index.ts                                              modulo TypeScript

supabase/functions/create-checkout/
  index.ts                                              modulo TypeScript

supabase/functions/driver-cpf-login/
  index.ts                                              modulo TypeScript

supabase/functions/driver-notifications-cron/
  index.ts                                              modulo TypeScript

supabase/functions/driver-upload-photo/
  index.ts                                              modulo TypeScript

supabase/functions/duelo-cron-advance/
  index.ts                                              Cron — avanço de fases do Campeonato Duelo. Roda a cada hora (UTC). Mantemos o schedule horário porque o RPC `campeonato_advance_phases` já lê `branches.timezone` por temporada e decide o avanço com base em `now()` compa

supabase/functions/duelo-cron-reconcile/
  index.ts                                              Cron — reconciliação diária do motor de pontuação do Campeonato Duelo. Recalcula pontos de classificações nas últimas 48h.

supabase/functions/earn-webhook/
  index.ts                                              modulo TypeScript

supabase/functions/enhance-image/
  index.ts                                              modulo TypeScript

supabase/functions/expire-pending-pins/
  index.ts                                              modulo TypeScript

supabase/functions/extract-products-from-image/
  index.ts                                              modulo TypeScript

supabase/functions/finalize-duels-cron/
  index.ts                                              modulo TypeScript

supabase/functions/import-drivers-bulk/
  index.ts                                              supabase/functions/import-drivers-bulk/index.ts

supabase/functions/invite-brand-user/
  index.ts                                              modulo TypeScript

supabase/functions/machine-webhook/
  index.ts                                              modulo TypeScript

supabase/functions/match-taxonomy/
  index.ts                                              modulo TypeScript

supabase/functions/mcp-server/
  index.ts                                              modulo TypeScript

supabase/functions/mirror-sync/
  auto-categorization.ts                                Pós-sync: classifica ofertas em categorias, ativa categorias com volume
  category-matcher.ts                                   Match fuzzy de produto → categoria, com mapa direto (API_CATEGORY_MAP) e
  governance.ts                                         Governança de sync groups: tracking de versão, detecção de ofertas
  helpers.ts                                            Parsers de preço + utilitários puros, sem efeitos colaterais.
  index.ts                                              Mirror-sync edge function — dispatcher.
  scrape-dvlinks.ts                                     Scraping de páginas DVLinks — parser HTML específico do layout do site
  scrape-vitrine.ts                                     Scraping da página vitrine do Divulgador Inteligente — extrai preços reais
  sync-divulgador.ts                                    Handler do source Divulgador Inteligente — API JSON + scraping vitrine
  sync-dvlinks.ts                                       Handler do source DVLinks — scraping HTML + upsert em affiliate_deals.
  types.ts                                              Tipos compartilhados entre os módulos de mirror-sync.

supabase/functions/mobility-webhook/
  index.ts                                              modulo TypeScript

supabase/functions/notify-driver-points/
  index.ts                                              modulo TypeScript

supabase/functions/provision-brand/
  index.ts                                              modulo TypeScript

supabase/functions/provision-trial/
  index.ts                                              modulo TypeScript

supabase/functions/register-machine-webhook/
  index.ts                                              modulo TypeScript

supabase/functions/reset-duelo-ciclo/
  index.ts                                              modulo TypeScript

supabase/functions/retry-failed-rides/
  index.ts                                              modulo TypeScript

supabase/functions/scrape-product/
  index.ts                                              modulo TypeScript

supabase/functions/seed-demo-stores/
  index.ts                                              modulo TypeScript

supabase/functions/send-driver-message/
  index.ts                                              modulo TypeScript

supabase/functions/send-otp-code/
  index.ts                                              modulo TypeScript

supabase/functions/send-push-notification/
  index.ts                                              modulo TypeScript

supabase/functions/send-telegram-ride-notification/
  index.ts                                              modulo TypeScript

supabase/functions/stripe-webhook/
  index.ts                                              modulo TypeScript

supabase/functions/submit-commercial-lead/
  index.ts                                              modulo TypeScript

supabase/functions/test-machine-credentials/
  index.ts                                              modulo TypeScript

supabase/functions/trial-reminders-cron/
  index.ts                                              deno-lint-ignore-file no-explicit-any

supabase/functions/validar-aposta-duelo/
  index.ts                                              modulo TypeScript

supabase/functions/verify-otp-code/
  index.ts                                              modulo TypeScript
```

### Testes end-to-end — `tests/`

```text

tests/e2e/audit/
  smoke.spec.ts                                         suite de testes

tests/e2e/campeonato/
  01-drawer-navigation.spec.ts                          suite de testes

tests/e2e/fixtures/
  constants.ts                                          Constantes determinísticas para o ambiente E2E. UUIDs fixos garantem que o seed seja idempotente (UPSERT) e o teardown possa remover os mesmos registros sem ambiguidade. CPF de teste padrão "00000000000" não é válido em 
  seed.sql                                              modulo TypeScript
  teardown.sql                                          modulo TypeScript

tests/e2e/helpers/
  driver-login.ts                                       modulo TypeScript — exporta: seedDriverSession, clearDriverSession
  seed-runner.ts                                        Roda os SQL de seed/teardown contra o Supabase de teste. Usa SERVICE_ROLE para bypassar RLS — exige variáveis de ambiente. Uso: npx tsx tests/e2e/helpers/seed-runner.ts seed npx tsx tests/e2e/helpers/seed-runner.ts teard
```

### Scripts utilitarios — `scripts/`

```text

scripts/
  lint-rls-migrations.ts                                Lint estático de migrations Supabase pra RLS. O QUE FAZ: Varre supabase/migrations/*.sql e detecta tabelas `public.*` que: 1. Foram criadas mas nunca tiveram `ENABLE ROW LEVEL SECURITY` aplicado 2. Tiveram RLS ativado ma
```

### Arquivos de configuracao na raiz

```text
  .env                                      variaveis publicas do frontend (gerado pela plataforma — nao editar).
  .gitleaks.toml                            regras de varredura de segredos.
  ARCHITECTURE_DECISION_RECORD.md           registro historico de decisoes de arquitetura.
  AUDIT_REPORT.md                           relatorio de auditoria tecnica.
  BUSINESS_MODELS_ARCHITECTURE.md           arquitetura dos modelos de negocio (Ganha-Ganha, mobilidade etc.).
  DEPRECATION_LOG.md                        itens depreciados e substituicoes.
  README.md                                 visao geral do repositorio.
  REMEDIATION_PLAN.md                       plano de correcoes tecnicas.
  TAXIMACHINE_FLOW.md                       modulo TypeScript
  TECH_DEBT.md                              debitos tecnicos conhecidos.
  components.json                           config do shadcn/ui (aliases e estilo dos componentes base).
  eslint.config.js                          regras de lint do projeto.
  index.html                                HTML raiz: metadados SEO/PWA, meta app-version e guarda que limpa Service Worker/caches antigos.
  package-lock.json                         modulo TypeScript
  package.json                              dependencias, versoes e scripts npm.
  playwright.audit.config.ts                config dos smoke tests de auditoria.
  playwright.config.ts                      config dos testes end-to-end.
  postcss.config.js                         pipeline PostCSS (tailwind + autoprefixer).
  tailwind.config.ts                        tokens de design do Tailwind (cores semanticas, raios, sombras, animacoes) — base do design system.
  tsconfig.app.json                         config TS da aplicacao (paths, strictness).
  tsconfig.json                             referencias de projeto TypeScript.
  tsconfig.node.json                        config TS dos arquivos de build/config.
  vite.config.ts                            config do Vite: alias @ -> src, porta 8080, plugin PWA (Service Worker, cacheId, runtime caching) e analise de bundle.
  vitest.config.ts                          config dos testes unitarios (Vitest + jsdom).
  supabase/config.toml                      config das edge functions (verify_jwt por funcao) — gerado/gerido pela plataforma.
  public/manifest.json                      manifest PWA servido estaticamente.
  public/robots.txt                         diretivas para crawlers.
  supabase/migrations/                      364 migrations historicas do banco (fonte: 01-BANCO.sql tem o estado atual).
  supabase/audit/                           scripts SQL de auditoria de RLS e performance.
```
