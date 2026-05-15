import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ModuleGuard from "@/components/ModuleGuard";
import ProtectedRoute from "@/components/ProtectedRoute";
import RootGuard from "@/components/RootGuard";
import {
  AccessHubPage,
  AchadinhosMobileImportPage,
  AffiliateCategoriesPage,
  AffiliateDealsPage,
  ApiDocsPage,
  ApproveStoreRulesPage,
  AppIconsConfigPage,
  AppLayout,
  AuditLogsPage,
  Auth,
  BannerManagerPage,
  BranchForm,
  BranchReportsPage,
  BranchWalletPage,
  Branches,
  BrandApiJourneyPage,
  BrandApiKeysPage,
  BrandBranchForm,
  BrandBranchesPage,
  BrandCidadesJourneyPage,
  BrandDomains,
  BrandForm,
  BrandJourneyGuidePage,
  BrandModulesPage,
  BrandPermissionOverflowPage,
  BrandSettingsPage,
  Brands,
  CloneBranchPage,
  CrmEmbedPage,
  CsvImportPage,
  CustomPage,
  CustomerPreviewPage,
  CustomersPage,
  Dashboard,
  DriverManagementPage,
  DriverPanelConfigPage,
  DriverPanelPage,
  DriverPointsPurchaseConfigPage,
  DriverPointsRulesPage,
  EarnPointsPage,
  EmitterJourneyGuidePage,
  EmitterRequestsPage,
  FeatureFlagsPage,
  GamificacaoAdminPage,
  GanhaGanhaBillingPage,
  GanhaGanhaClosingReportsPage,
  GanhaGanhaConfigPage,
  GanhaGanhaReportsPage,
  GanhaGanhaRootDashboardPage,
  GanhaGanhaStoreSummaryPage,
  HomeTemplatesPage,
  IconLibraryPage,
  InstallPwaPage,
  LandingPage,
  MachineIntegrationPage,
  MachineWebhookTestPage,
  ManuaisPage,
  McpDashboardPage,
  MenuLabelsPage,
  MirrorSyncPage,
  ModuleDefinitionsPage,
  NotFound,
  OfferCardConfigPage,
  OfferGovernancePage,
  OffersPage,
  OperatorRedeemPage,
  PageBuilderPage,
  PageBuilderV2Page,
  PaginaAdminOrigens,
  PaginaAdminUbizOfertas,
  PaginaAgendarDemonstracao,
  PaginaAuditoriaDuplicacoes,
  PaginaCampeonatoStandalone,
  PaginaCatalogoProdutos,
  PaginaCentralModulos,
  PaginaConfigurarGanhaGanha,
  PaginaConfiguracaoCidade,
  PaginaConfiguracaoModulosCidade,
  PaginaConversaoResgate,
  PaginaDetalhesLead,
  PaginaDiagnosticoMarca,
  PaginaDominiosMarca,
  PaginaHallDaFama,
  PaginaLandingProduto,
  PaginaLeadsComerciais,
  PaginaLinks,
  PaginaLojaPacotes,
  PaginaLojaPublica,
  PaginaModelosPorCidadeBranch,
  PaginaOnboardingCidade,
  PaginaPacotesPontos,
  PaginaProdutosComerciais,
  PaginaRelatorioCorridas,
  PaginaUbizOfertas,
  PartnerLandingConfigPage,
  PartnerLandingPage,
  PermissionsPage,
  PlanModuleTemplatesPage,
  PlatformThemePage,
  PointsLedgerPage,
  PointsRulesPage,
  ProdutosResgatePage,
  ProductRedemptionOrdersPage,
  ProfileLinksConfigPage,
  ProvisionBrandWizard,
  PublicVouchers,
  RedemptionsPage,
  RegrasResgatePage,
  ReleasesPage,
  ReportsPage,
  ResetPassword,
  RootJourneyGuidePage,
  RotaCampeonatoMotorista,
  SectionTemplatesPage,
  SendNotificationPage,
  SponsoredPlacementsPage,
  StarterKitConfigPage,
  StoreCatalogPage,
  StoreGanhaGanhaPage,
  StoreOwnerPanel,
  StorePointsRulePage,
  StoreRegistrationWizard,
  StoresPage,
  SubscriptionPage,
  TaxonomyPage,
  TenantForm,
  Tenants,
  TierPointsRulesPage,
  TrialSignupPage,
  UsersPage,
  VoucherForm,
  VoucherRedeem,
  VoucherWizardPage,
  Vouchers,
  WebviewPage,
  WelcomeTourConfigPage,
} from "@/lib/lazyPages";
import { PageLoader } from "./PageLoader";

/**
 * Mapa principal de rotas da aplicação. Renderizado dentro de AppContent
 * sempre que a rota não cair no fast-track (`/ofertas`, `/driver`, etc.)
 * nem em um override de white-label.
 *
 * Convenções:
 * - Rotas filhas de `/` ficam aninhadas dentro de `<ProtectedRoute><AppLayout/></ProtectedRoute>`.
 * - `<ModuleGuard moduleKey="X">` impõe o módulo no nível de rota.
 * - `<RootGuard>` restringe a `root_admin`.
 * - `moduleKey="a|b"` é OR (qualquer um dos módulos libera acesso).
 */
export function AnimatedRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/index" element={<Navigate to="/" replace />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/customer-preview" element={<CustomerPreviewPage />} />
        <Route path="/webview" element={<WebviewPage />} />
        <Route path="/p/:slug" element={<CustomPage />} />
        <Route path="/trial" element={<TrialSignupPage />} />
        <Route path="/p/produto/:slug/demo" element={<PaginaAgendarDemonstracao />} />
        <Route path="/p/produto/:slug" element={<PaginaLandingProduto />} />
        <Route path="/produtos" element={<PaginaCatalogoProdutos />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/links" element={<PaginaLinks />} />
        <Route path="/driver" element={<DriverPanelPage />} />
        <Route path="/motorista/campeonato" element={<RotaCampeonatoMotorista />} />
        <Route path="/mcp-dashboard" element={<McpDashboardPage />} />
        <Route path="/:slug/parceiro" element={<PartnerLandingPage />} />
        <Route path="/register-store" element={<StoreRegistrationWizard />} />
        <Route path="/loja/:slug" element={<PaginaLojaPublica />} />
        <Route path="/ofertas" element={<PaginaUbizOfertas />} />
        <Route path="/campeonato/:brandSlug/hall-da-fama" element={<PaginaHallDaFama />} />
        <Route path="/install" element={<InstallPwaPage />} />
        <Route path="/store-panel" element={<ProtectedRoute><StoreOwnerPanel /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/new" element={<TenantForm />} />
          <Route path="tenants/:id" element={<TenantForm />} />
          <Route path="brands" element={<Brands />} />
          <Route path="brands/new" element={<BrandForm />} />
          <Route path="brands/:id" element={<BrandForm />} />
          <Route path="branches" element={<Branches />} />
          <Route path="branches/new" element={<BranchForm />} />
          <Route path="branches/:id" element={<BranchForm />} />
          <Route path="vouchers" element={<ModuleGuard moduleKey="vouchers"><Vouchers /></ModuleGuard>} />
          <Route path="vouchers/new" element={<ModuleGuard moduleKey="vouchers"><VoucherWizardPage /></ModuleGuard>} />
          <Route path="vouchers/redeem" element={<ModuleGuard moduleKey="vouchers"><VoucherRedeem /></ModuleGuard>} />
          <Route path="vouchers/:id" element={<ModuleGuard moduleKey="vouchers"><VoucherForm /></ModuleGuard>} />
          <Route path="domains" element={<RootGuard><BrandDomains /></RootGuard>} />
          <Route path="brand-domains" element={<PaginaDominiosMarca />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="stores" element={<ModuleGuard moduleKey="stores"><StoresPage /></ModuleGuard>} />
          <Route path="offers" element={<ModuleGuard moduleKey="offers"><OffersPage /></ModuleGuard>} />
          <Route path="customers" element={<ModuleGuard moduleKey="wallet"><CustomersPage /></ModuleGuard>} />
          <Route path="redemptions" element={<ModuleGuard moduleKey="redemption_qr"><RedemptionsPage /></ModuleGuard>} />
          <Route path="templates" element={<RootGuard><SectionTemplatesPage /></RootGuard>} />
          <Route path="modules" element={<RootGuard><ModuleDefinitionsPage /></RootGuard>} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="flags" element={<RootGuard><FeatureFlagsPage /></RootGuard>} />
          <Route path="audit" element={<ModuleGuard moduleKey="audit"><AuditLogsPage /></ModuleGuard>} />
          <Route path="releases" element={<RootGuard><ReleasesPage /></RootGuard>} />
          <Route path="admin-origens" element={<RootGuard><PaginaAdminOrigens /></RootGuard>} />
          <Route path="home-templates" element={<RootGuard><HomeTemplatesPage /></RootGuard>} />
          <Route path="csv-import" element={<ModuleGuard moduleKey="csv_import"><CsvImportPage /></ModuleGuard>} />
          <Route path="clone-branch" element={<RootGuard><CloneBranchPage /></RootGuard>} />
          <Route path="brand-modules" element={<BrandModulesPage />} />
          <Route path="brand-modules/ganha-ganha" element={<PaginaConfigurarGanhaGanha />} />
          <Route path="branch-business-models" element={<PaginaModelosPorCidadeBranch />} />
          <Route path="admin/central-modulos" element={<RootGuard><PaginaCentralModulos /></RootGuard>} />
          <Route path="pdv" element={<ModuleGuard moduleKey="earn_points_store"><OperatorRedeemPage /></ModuleGuard>} />
          <Route path="points-rules" element={<ModuleGuard moduleKey="earn_points_store"><PointsRulesPage /></ModuleGuard>} />
          <Route path="earn-points" element={<ModuleGuard moduleKey="earn_points_store"><EarnPointsPage /></ModuleGuard>} />
          <Route path="points-ledger" element={<ModuleGuard moduleKey="earn_points_store"><PointsLedgerPage /></ModuleGuard>} />
          <Route path="store-points-rule" element={<ModuleGuard moduleKey="earn_points_store"><StorePointsRulePage /></ModuleGuard>} />
          <Route path="approve-store-rules" element={<ModuleGuard moduleKey="multi_emitter"><ApproveStoreRulesPage /></ModuleGuard>} />
          <Route path="tier-points-rules" element={<ModuleGuard moduleKey="earn_points_store"><TierPointsRulesPage /></ModuleGuard>} />

          <Route path="affiliate-deals" element={<ModuleGuard moduleKey="affiliate_deals"><AffiliateDealsPage /></ModuleGuard>} />
          <Route path="affiliate-deals/import-mobile" element={<ModuleGuard moduleKey="affiliate_deals"><AchadinhosMobileImportPage /></ModuleGuard>} />
          <Route path="affiliate-categories" element={<ModuleGuard moduleKey="affiliate_deals"><AffiliateCategoriesPage /></ModuleGuard>} />
          <Route path="ubiz-ofertas-admin" element={<ModuleGuard moduleKey="affiliate_deals"><PaginaAdminUbizOfertas /></ModuleGuard>} />
          <Route path="mirror-sync" element={<ModuleGuard moduleKey="affiliate_deals"><MirrorSyncPage /></ModuleGuard>} />
          <Route path="offer-governance" element={<ModuleGuard moduleKey="affiliate_deals"><OfferGovernancePage /></ModuleGuard>} />
          <Route path="product-redemption-orders" element={<ModuleGuard moduleKey="affiliate_deals|achadinhos_motorista"><ProductRedemptionOrdersPage /></ModuleGuard>} />
          <Route path="produtos-resgate" element={<ModuleGuard moduleKey="affiliate_deals|achadinhos_motorista"><ProdutosResgatePage /></ModuleGuard>} />
          <Route path="regras-resgate" element={<ModuleGuard moduleKey="affiliate_deals"><RegrasResgatePage /></ModuleGuard>} />
          <Route path="conversao-resgate" element={<ModuleGuard moduleKey="affiliate_deals"><PaginaConversaoResgate /></ModuleGuard>} />
          <Route path="store-catalog" element={<ModuleGuard moduleKey="catalog"><StoreCatalogPage /></ModuleGuard>} />
          <Route path="reports" element={<ModuleGuard moduleKey="reports"><ReportsPage /></ModuleGuard>} />
          <Route path="send-notification" element={<ModuleGuard moduleKey="notifications"><SendNotificationPage /></ModuleGuard>} />
          <Route path="icon-library" element={<ModuleGuard moduleKey="icon_library"><IconLibraryPage /></ModuleGuard>} />
          <Route path="banner-manager" element={<ModuleGuard moduleKey="banners"><BannerManagerPage /></ModuleGuard>} />
          <Route path="menu-labels" element={<RootGuard><MenuLabelsPage /></RootGuard>} />
          <Route path="page-builder" element={<ModuleGuard moduleKey="page_builder"><PageBuilderPage /></ModuleGuard>} />
          <Route path="page-builder-v2" element={<ModuleGuard moduleKey="page_builder"><PageBuilderV2Page /></ModuleGuard>} />
          <Route path="public-vouchers" element={<PublicVouchers />} />

          <Route path="provision-brand" element={<RootGuard><ProvisionBrandWizard /></RootGuard>} />
          <Route path="brand-permissions" element={<ModuleGuard moduleKey="store_permissions"><BrandPermissionOverflowPage /></ModuleGuard>} />
          <Route path="taxonomy" element={<ModuleGuard moduleKey="taxonomy"><TaxonomyPage /></ModuleGuard>} />
          <Route path="starter-kit" element={<RootGuard><StarterKitConfigPage /></RootGuard>} />
          <Route path="emitter-requests" element={<ModuleGuard moduleKey="multi_emitter"><EmitterRequestsPage /></ModuleGuard>} />
          <Route path="root-journey" element={<RootGuard><RootJourneyGuidePage /></RootGuard>} />
          <Route path="brand-journey" element={<BrandJourneyGuidePage />} />
          <Route path="emitter-journey" element={<EmitterJourneyGuidePage />} />
          <Route path="platform-theme" element={<RootGuard><PlatformThemePage /></RootGuard>} />
          <Route path="app-icons" element={<RootGuard><AppIconsConfigPage /></RootGuard>} />
          <Route path="welcome-tour" element={<ModuleGuard moduleKey="welcome_tour"><WelcomeTourConfigPage /></ModuleGuard>} />
          <Route path="profile-links" element={<ModuleGuard moduleKey="profile_links"><ProfileLinksConfigPage /></ModuleGuard>} />
          <Route path="ganha-ganha-config" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaConfigPage /></ModuleGuard>} />
          <Route path="ganha-ganha-billing" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaBillingPage /></ModuleGuard>} />
          <Route path="ganha-ganha-closing" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaClosingReportsPage /></ModuleGuard>} />
          <Route path="ganha-ganha-dashboard" element={<RootGuard><GanhaGanhaRootDashboardPage /></RootGuard>} />
          <Route path="ganha-ganha-store-summary" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaStoreSummaryPage /></ModuleGuard>} />
          <Route path="ganha-ganha-reports" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaReportsPage /></ModuleGuard>} />
          <Route path="store/ganha-ganha" element={<StoreGanhaGanhaPage />} />

          <Route path="api-keys" element={<ModuleGuard moduleKey="api_keys"><BrandApiKeysPage /></ModuleGuard>} />
          <Route path="api-docs" element={<ModuleGuard moduleKey="api_keys"><ApiDocsPage /></ModuleGuard>} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="partner-landing-config" element={<ModuleGuard moduleKey="partner_landing"><PartnerLandingConfigPage /></ModuleGuard>} />
          <Route path="access-hub" element={<ModuleGuard moduleKey="access_hub"><AccessHubPage /></ModuleGuard>} />
          <Route path="brand-settings" element={<ModuleGuard moduleKey="brand_settings"><BrandSettingsPage /></ModuleGuard>} />
          <Route path="sponsored-placements" element={<ModuleGuard moduleKey="sponsored"><SponsoredPlacementsPage /></ModuleGuard>} />
          <Route path="machine-integration" element={<ModuleGuard moduleKey="machine_integration"><MachineIntegrationPage /></ModuleGuard>} />
          <Route path="machine-webhook-test" element={<ModuleGuard moduleKey="machine_integration"><MachineWebhookTestPage /></ModuleGuard>} />
          <Route path="driver-points-rules" element={<ModuleGuard moduleKey="machine_integration|achadinhos_motorista"><DriverPointsRulesPage /></ModuleGuard>} />
          <Route path="motoristas" element={<ModuleGuard moduleKey="machine_integration|achadinhos_motorista"><DriverManagementPage /></ModuleGuard>} />
          <Route path="driver-points-purchase" element={<ModuleGuard moduleKey="machine_integration|achadinhos_motorista"><DriverPointsPurchaseConfigPage /></ModuleGuard>} />
          <Route path="offer-card-config" element={<ModuleGuard moduleKey="offer_card_config"><OfferCardConfigPage /></ModuleGuard>} />
          <Route path="plan-templates" element={<RootGuard><PlanModuleTemplatesPage /></RootGuard>} />

          <Route path="admin/produtos-comerciais" element={<RootGuard><PaginaProdutosComerciais /></RootGuard>} />
          <Route path="admin/auditoria-duplicacoes" element={<RootGuard><PaginaAuditoriaDuplicacoes /></RootGuard>} />
          <Route path="admin/diagnostico-marca/:brandId" element={<RootGuard><PaginaDiagnosticoMarca /></RootGuard>} />
          <Route path="leads-comerciais" element={<RootGuard><PaginaLeadsComerciais /></RootGuard>} />
          <Route path="leads-comerciais/:id" element={<RootGuard><PaginaDetalhesLead /></RootGuard>} />
          <Route path="driver-config" element={<ErrorBoundary><DriverPanelConfigPage /></ErrorBoundary>} />
          <Route path="crm/*" element={<ModuleGuard moduleKey="crm"><CrmEmbedPage /></ModuleGuard>} />
          <Route path="manuais" element={<ManuaisPage />} />
          <Route path="branch-wallet" element={<BranchWalletPage />} />
          <Route path="branch-reports" element={<BranchReportsPage />} />
          <Route path="brand-branches" element={<BrandBranchesPage />} />
          <Route path="relatorio-corridas" element={<PaginaRelatorioCorridas />} />
          <Route path="brand-branches/new" element={<BrandBranchForm />} />
          <Route path="brand-branches/:id" element={<BrandBranchForm />} />
          <Route path="brand-cidades-journey" element={<BrandCidadesJourneyPage />} />
          <Route path="brand-api-journey" element={<BrandApiJourneyPage />} />
          <Route path="city-onboarding" element={<PaginaOnboardingCidade />} />
          <Route path="configuracao-cidade" element={<PaginaConfiguracaoCidade />} />
          <Route path="configuracao-modulos-cidade" element={<PaginaConfiguracaoModulosCidade />} />
          <Route path="gamificacao-admin" element={<ModuleGuard moduleKey="achadinhos_motorista"><GamificacaoAdminPage /></ModuleGuard>} />
          <Route path="campeonato" element={<PaginaCampeonatoStandalone />} />
          <Route path="points-packages" element={<PaginaPacotesPontos />} />
          <Route path="points-packages-store" element={<PaginaLojaPacotes />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
