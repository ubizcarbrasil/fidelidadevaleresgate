# 04-ROTAS.md — Mapa completo de rotas

Arquitetura de roteamento (react-router-dom v6, tudo lazy-loaded via `src/lib/lazyPages.ts`):

```text
main.tsx -> App.tsx
  ErrorBoundary > QueryClientProvider > OfertasFastTrack > AuthProvider > BrandProvider
    > TooltipProvider > BrowserRouter > AppContent

AppContent decide a arvore de rotas nesta ordem:
  1. isPartnerLandingPath("/:slug/parceiro") -> PartnerLandingPage (publico)
  2. isDriverPath("/driver...")              -> DriverPanelPage    (PWA do motorista)
  3. isOfertasPath("/ofertas...")            -> PaginaUbizOfertas  (fast-track publico)
  4. isPortalDomain() (app.valeresgate.com.br):
       - rota publica              -> AnimatedRoutes
       - sem sessao                -> redirect /auth
       - papel admin/loja          -> AnimatedRoutes (painel)
       - somente cliente final     -> WhiteLabelLayout
  5. isWhiteLabel (dominio de marca):
       - admin/loja da marca       -> AnimatedRoutes
       - rota publica              -> AnimatedRoutes
       - demais                    -> WhiteLabelLayout (app do cliente)
  6. fallback                                -> AnimatedRoutes
```

## Fast-track e rotas publicas (src/lib/routeConditions.ts)

- `PORTAL_HOSTNAME` = `app.valeresgate.com.br`
- `PUBLIC_PATHS` = `/auth`, `/reset-password`, `/trial`, `/landing`, `/register-store`, `/p/`, `/driver`, `/d/`, `/loja/`, `/ofertas`
- `shouldUseFastTrack()` = `/ofertas*`, `/webview*`, `/driver*` — pulam Auth/BrandProvider (in-app browsers onde `getSession()` pode travar).

## Tabela de rotas (src/routes/AnimatedRoutes.tsx)

| Rota | Componente | Arquivo | Protecao |
|---|---|---|---|
| `/index` | redirect | — | redireciona para `/` |
| `/index.html` | redirect | — | redireciona para `/` |
| `/auth` | Auth | src/pages/Auth.tsx | publica |
| `/reset-password` | ResetPassword | src/pages/ResetPassword.tsx | publica |
| `/customer-preview` | CustomerPreviewPage | src/pages/CustomerPreviewPage.tsx | publica |
| `/webview` | WebviewPage | src/pages/customer/WebviewPage.tsx | publica |
| `/p/:slug` | CustomPage | src/pages/customer/CustomPage.tsx | publica |
| `/trial` | TrialSignupPage | src/pages/TrialSignupPage.tsx | publica |
| `/p/produto/:slug/demo` | PaginaAgendarDemonstracao | src/features/agendar_demonstracao/pagina_agendar_demonstracao.tsx | publica |
| `/p/produto/:slug` | PaginaLandingProduto | src/features/landing_produto/pagina_landing_produto.tsx | publica |
| `/produtos` | PaginaCatalogoProdutos | src/features/catalogo_produtos/pagina_catalogo_produtos.tsx | publica |
| `/landing` | LandingPage | src/pages/LandingPage.tsx | publica |
| `/links` | PaginaLinks | src/features/pagina_links/pagina_links.tsx | publica |
| `/driver` | DriverPanelPage | src/pages/DriverPanelPage.tsx | publica |
| `/mcp-dashboard` | McpDashboardPage | src/pages/McpDashboardPage.tsx | publica |
| `/:slug/parceiro` | PartnerLandingPage | src/pages/PartnerLandingPage.tsx | publica |
| `/register-store` | StoreRegistrationWizard | src/pages/StoreRegistrationWizard.tsx | publica |
| `/loja/:slug` | PaginaLojaPublica | src/features/loja_publica/pagina_loja_publica.tsx | publica |
| `/ofertas` | PaginaUbizOfertas | src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx | publica |
| `/install` | InstallPwaPage | src/pages/InstallPwaPage.tsx | publica |
| `/store-panel` | StoreOwnerPanel | src/pages/StoreOwnerPanel.tsx | ProtectedRoute |
| `/` (layout) | AppLayout | src/components/AppLayout.tsx | ProtectedRoute (sessao obrigatoria) |
| `/tenants` | Tenants | src/pages/Tenants.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/tenants/new` | TenantForm | src/pages/TenantForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/tenants/:id` | TenantForm | src/pages/TenantForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brands` | Brands | src/pages/Brands.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brands/new` | BrandForm | src/pages/BrandForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brands/:id` | BrandForm | src/pages/BrandForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/branches` | Branches | src/pages/Branches.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/branches/new` | BranchForm | src/pages/BranchForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/branches/:id` | BranchForm | src/pages/BranchForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/vouchers` | Vouchers | src/pages/Vouchers.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `vouchers` |
| `/vouchers/new` | VoucherWizardPage | src/pages/VoucherWizardPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `vouchers` |
| `/vouchers/redeem` | VoucherRedeem | src/pages/VoucherRedeem.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `vouchers` |
| `/vouchers/:id` | VoucherForm | src/pages/VoucherForm.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `vouchers` |
| `/domains` | BrandDomains | src/pages/BrandDomains.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/brand-domains` | PaginaDominiosMarca | src/pages/PaginaDominiosMarca.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/users` | UsersPage | src/pages/UsersPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/stores` | StoresPage | src/pages/StoresPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `stores` |
| `/offers` | OffersPage | src/pages/OffersPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `offers` |
| `/customers` | CustomersPage | src/pages/CustomersPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `wallet` |
| `/redemptions` | RedemptionsPage | src/pages/RedemptionsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `redemption_qr` |
| `/templates` | SectionTemplatesPage | src/pages/SectionTemplatesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/modules` | ModuleDefinitionsPage | src/pages/ModuleDefinitionsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/permissions` | PermissionsPage | src/pages/PermissionsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/flags` | FeatureFlagsPage | src/pages/FeatureFlagsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/audit` | AuditLogsPage | src/pages/AuditLogsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `audit` |
| `/releases` | ReleasesPage | src/pages/ReleasesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/admin-origens` | PaginaAdminOrigens | src/features/admin_origens/pagina_admin_origens.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/home-templates` | HomeTemplatesPage | src/pages/HomeTemplatesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/csv-import` | CsvImportPage | src/pages/CsvImportPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `csv_import` |
| `/clone-branch` | CloneBranchPage | src/pages/CloneBranchPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/brand-modules` | BrandModulesPage | src/pages/BrandModulesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brand-modules/ganha-ganha` | PaginaConfigurarGanhaGanha | src/features/painel_modelos_negocio/pagina_configurar_ganha_ganha.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/branch-business-models` | PaginaModelosPorCidadeBranch | src/features/painel_modelos_negocio/pagina_modelos_por_cidade_branch.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/admin/central-modulos` | PaginaCentralModulos | src/features/central_modulos/pagina_central_modulos.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/pdv` | OperatorRedeemPage | src/pages/OperatorRedeemPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `earn_points_store` |
| `/points-rules` | PointsRulesPage | src/pages/PointsRulesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `earn_points_store` |
| `/earn-points` | EarnPointsPage | src/pages/EarnPointsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `earn_points_store` |
| `/points-ledger` | PointsLedgerPage | src/pages/PointsLedgerPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `earn_points_store` |
| `/store-points-rule` | StorePointsRulePage | src/pages/StorePointsRulePage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `earn_points_store` |
| `/approve-store-rules` | ApproveStoreRulesPage | src/pages/ApproveStoreRulesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `multi_emitter` |
| `/tier-points-rules` | TierPointsRulesPage | src/pages/TierPointsRulesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `earn_points_store` |
| `/affiliate-deals` | AffiliateDealsPage | src/pages/AffiliateDealsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/affiliate-deals/import-mobile` | AchadinhosMobileImportPage | src/pages/AchadinhosMobileImportPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/affiliate-categories` | AffiliateCategoriesPage | src/pages/AffiliateCategoriesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/ubiz-ofertas-admin` | PaginaAdminUbizOfertas | src/features/ubiz_ofertas_admin/pagina_admin_ubiz_ofertas.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/mirror-sync` | MirrorSyncPage | src/pages/MirrorSyncPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/offer-governance` | OfferGovernancePage | src/pages/OfferGovernancePage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/product-redemption-orders` | ProductRedemptionOrdersPage | src/pages/ProductRedemptionOrdersPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals|achadinhos_motorista` |
| `/produtos-resgate` | ProdutosResgatePage | src/pages/ProdutosResgatePage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals|achadinhos_motorista` |
| `/regras-resgate` | RegrasResgatePage | src/pages/RegrasResgatePage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/conversao-resgate` | PaginaConversaoResgate | src/pages/conversao_resgate/pagina_conversao_resgate.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `affiliate_deals` |
| `/store-catalog` | StoreCatalogPage | src/pages/StoreCatalogPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `catalog` |
| `/reports` | ReportsPage | src/pages/ReportsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `reports` |
| `/send-notification` | SendNotificationPage | src/pages/SendNotificationPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `notifications` |
| `/icon-library` | IconLibraryPage | src/pages/IconLibraryPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `icon_library` |
| `/banner-manager` | BannerManagerPage | src/pages/BannerManagerPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `banners` |
| `/menu-labels` | MenuLabelsPage | src/pages/MenuLabelsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/page-builder` | PageBuilderPage | src/pages/PageBuilderPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `page_builder` |
| `/page-builder-v2` | PageBuilderV2Page | src/pages/PageBuilderV2Page.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `page_builder` |
| `/public-vouchers` | PublicVouchers | src/pages/PublicVouchers.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/provision-brand` | ProvisionBrandWizard | src/pages/ProvisionBrandWizard.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/brand-permissions` | BrandPermissionOverflowPage | src/pages/BrandPermissionOverflowPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `store_permissions` |
| `/taxonomy` | TaxonomyPage | src/pages/TaxonomyPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `taxonomy` |
| `/starter-kit` | StarterKitConfigPage | src/pages/StarterKitConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/emitter-requests` | EmitterRequestsPage | src/pages/EmitterRequestsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `multi_emitter` |
| `/root-journey` | RootJourneyGuidePage | src/pages/RootJourneyGuidePage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/brand-journey` | BrandJourneyGuidePage | src/pages/BrandJourneyGuidePage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/emitter-journey` | EmitterJourneyGuidePage | src/pages/EmitterJourneyGuidePage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/platform-theme` | PlatformThemePage | src/pages/PlatformThemePage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/app-icons` | AppIconsConfigPage | src/pages/AppIconsConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/welcome-tour` | WelcomeTourConfigPage | src/pages/WelcomeTourConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `welcome_tour` |
| `/profile-links` | ProfileLinksConfigPage | src/pages/ProfileLinksConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `profile_links` |
| `/ganha-ganha-config` | GanhaGanhaConfigPage | src/pages/GanhaGanhaConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `ganha_ganha` |
| `/ganha-ganha-billing` | GanhaGanhaBillingPage | src/pages/GanhaGanhaBillingPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `ganha_ganha` |
| `/ganha-ganha-closing` | GanhaGanhaClosingReportsPage | src/pages/GanhaGanhaClosingReportsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `ganha_ganha` |
| `/ganha-ganha-dashboard` | GanhaGanhaRootDashboardPage | src/pages/GanhaGanhaRootDashboardPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/ganha-ganha-store-summary` | GanhaGanhaStoreSummaryPage | src/pages/GanhaGanhaStoreSummaryPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `ganha_ganha` |
| `/ganha-ganha-reports` | GanhaGanhaReportsPage | src/pages/GanhaGanhaReportsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `ganha_ganha` |
| `/store/ganha-ganha` | StoreGanhaGanhaPage | src/pages/StoreGanhaGanhaPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/api-keys` | BrandApiKeysPage | src/pages/BrandApiKeysPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `api_keys` |
| `/api-docs` | ApiDocsPage | src/pages/ApiDocsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `api_keys` |
| `/subscription` | SubscriptionPage | src/pages/SubscriptionPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/partner-landing-config` | PartnerLandingConfigPage | src/pages/PartnerLandingConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `partner_landing` |
| `/access-hub` | AccessHubPage | src/pages/AccessHubPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `access_hub` |
| `/brand-settings` | BrandSettingsPage | src/pages/BrandSettingsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `brand_settings` |
| `/sponsored-placements` | SponsoredPlacementsPage | src/pages/SponsoredPlacementsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `sponsored` |
| `/machine-integration` | MachineIntegrationPage | src/pages/MachineIntegrationPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `machine_integration` |
| `/machine-webhook-test` | MachineWebhookTestPage | src/pages/MachineWebhookTestPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `machine_integration` |
| `/driver-points-rules` | DriverPointsRulesPage | src/pages/DriverPointsRulesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `machine_integration|achadinhos_motorista` |
| `/motoristas` | DriverManagementPage | src/pages/DriverManagementPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `machine_integration|achadinhos_motorista` |
| `/driver-points-purchase` | DriverPointsPurchaseConfigPage | src/features/compra_pontos_motorista/pagina_compra_pontos_config.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `machine_integration|achadinhos_motorista` |
| `/offer-card-config` | OfferCardConfigPage | src/pages/OfferCardConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `offer_card_config` |
| `/plan-templates` | PlanModuleTemplatesPage | src/pages/PlanModuleTemplatesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/admin/produtos-comerciais` | PaginaProdutosComerciais | src/features/produtos_comerciais/pagina_produtos_comerciais.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/admin/auditoria-duplicacoes` | PaginaAuditoriaDuplicacoes | src/features/auditoria_duplicacoes/pagina_auditoria_duplicacoes.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/admin/diagnostico-marca/:brandId` | PaginaDiagnosticoMarca | src/features/diagnostico_marca/pagina_diagnostico_marca.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/leads-comerciais` | PaginaLeadsComerciais | src/features/leads_comerciais/pagina_leads_comerciais.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/leads-comerciais/:id` | PaginaDetalhesLead | src/features/leads_comerciais/pagina_detalhes_lead.tsx | dentro de `/` (ProtectedRoute + AppLayout), RootGuard (root_admin) |
| `/driver-config` | DriverPanelConfigPage | src/pages/DriverPanelConfigPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ErrorBoundary |
| `/crm/*` | CrmEmbedPage | src/pages/CrmEmbedPage.tsx | dentro de `/` (ProtectedRoute + AppLayout), ModuleGuard: `crm` |
| `/manuais` | ManuaisPage | src/pages/ManuaisPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/branch-wallet` | BranchWalletPage | src/pages/BranchWalletPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/branch-reports` | BranchReportsPage | src/pages/BranchReportsPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brand-branches` | BrandBranchesPage | src/pages/BrandBranchesPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/relatorio-corridas` | PaginaRelatorioCorridas | src/features/relatorio_corridas/pagina_relatorio_corridas.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brand-branches/new` | BrandBranchForm | src/pages/BrandBranchForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brand-branches/:id` | BrandBranchForm | src/pages/BrandBranchForm.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brand-cidades-journey` | BrandCidadesJourneyPage | src/pages/BrandCidadesJourneyPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/brand-api-journey` | BrandApiJourneyPage | src/pages/BrandApiJourneyPage.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/city-onboarding` | PaginaOnboardingCidade | src/features/city_onboarding/pagina_onboarding_cidade.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/configuracao-cidade` | PaginaConfiguracaoCidade | src/features/configuracao_cidade/pagina_configuracao_cidade.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/configuracao-modulos-cidade` | PaginaConfiguracaoModulosCidade | src/features/configuracao_modulos_cidade/pagina_configuracao_modulos_cidade.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/points-packages` | PaginaPacotesPontos | src/features/pacotes_pontos/pagina_pacotes_pontos.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `/points-packages-store` | PaginaLojaPacotes | src/features/pacotes_pontos/pagina_loja_pacotes.tsx | dentro de `/` (ProtectedRoute + AppLayout) |
| `*` | NotFound | src/pages/NotFound.tsx | dentro de `/` (ProtectedRoute + AppLayout) |

## Rotas do app do cliente final (WhiteLabelLayout)

`src/components/WhiteLabelLayout.tsx` monta a experiencia do consumidor final por dominio de marca; as telas ficam em `src/pages/customer/` e `src/components/customer/`.

## Painel do motorista

`/driver` é servido fora do `AnimatedRoutes` (fast-track) por `src/pages/DriverPanelPage.tsx`, com sessao propria (`src/contexts/DriverSessionContext.tsx`) baseada em CPF, nao em `auth.users`.

