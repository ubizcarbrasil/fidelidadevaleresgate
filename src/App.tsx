// rebuild-trigger v2026-04-02a
import { Suspense, lazy, forwardRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePWA } from "@/hooks/usePWA";
import PWAUpdateBanner from "@/components/pwa/PWAUpdateBanner";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";
import { useBrand } from "@/contexts/BrandContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleGuard from "@/components/ModuleGuard";
import RootGuard from "@/components/RootGuard";
const AppLayout = lazyWithRetry(() => import("@/components/AppLayout"));
const WhiteLabelLayout = lazyWithRetry(() => import("@/components/WhiteLabelLayout"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
import { Loader2 } from "lucide-react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
// MountSignal moved to BootShell in main.tsx for instant bootstrap dismissal
const RootJourneyGuidePage = lazyWithRetry(() => import("@/pages/RootJourneyGuidePage"));
import { queryClient } from "@/lib/queryClient";
import { initEventBusQueryBridge } from "@/lib/eventBusQueryBridge";
const BrandJourneyGuidePage = lazyWithRetry(() => import("@/pages/BrandJourneyGuidePage"));

// Lazy-loaded pages
const Auth = lazyWithRetry(() => import("@/pages/Auth"));
const ResetPassword = lazyWithRetry(() => import("@/pages/ResetPassword"));
const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
const Tenants = lazyWithRetry(() => import("@/pages/Tenants"));
const TenantForm = lazyWithRetry(() => import("@/pages/TenantForm"));
const Brands = lazyWithRetry(() => import("@/pages/Brands"));
const BrandForm = lazyWithRetry(() => import("@/pages/BrandForm"));
const Branches = lazyWithRetry(() => import("@/pages/Branches"));
const BranchForm = lazyWithRetry(() => import("@/pages/BranchForm"));
const Vouchers = lazyWithRetry(() => import("@/pages/Vouchers"));
const VoucherForm = lazyWithRetry(() => import("@/pages/VoucherForm"));
const VoucherWizardPage = lazyWithRetry(() => import("@/pages/VoucherWizardPage"));
const VoucherRedeem = lazyWithRetry(() => import("@/pages/VoucherRedeem"));
const BrandDomains = lazyWithRetry(() => import("@/pages/BrandDomains"));
const PaginaDominiosMarca = lazyWithRetry(() => import("@/pages/PaginaDominiosMarca"));
const UsersPage = lazyWithRetry(() => import("@/pages/UsersPage"));
const StoresPage = lazyWithRetry(() => import("@/pages/StoresPage"));
const OffersPage = lazyWithRetry(() => import("@/pages/OffersPage"));
const CustomersPage = lazyWithRetry(() => import("@/pages/CustomersPage"));
const RedemptionsPage = lazyWithRetry(() => import("@/pages/RedemptionsPage"));
const SectionTemplatesPage = lazyWithRetry(() => import("@/pages/SectionTemplatesPage"));
const ModuleDefinitionsPage = lazyWithRetry(() => import("@/pages/ModuleDefinitionsPage"));
const FeatureFlagsPage = lazyWithRetry(() => import("@/pages/FeatureFlagsPage"));
const PermissionsPage = lazyWithRetry(() => import("@/pages/PermissionsPage"));
const AuditLogsPage = lazyWithRetry(() => import("@/pages/AuditLogsPage"));
const ReleasesPage = lazyWithRetry(() => import("@/pages/ReleasesPage"));
const OperatorRedeemPage = lazyWithRetry(() => import("@/pages/OperatorRedeemPage"));
const HomeTemplatesPage = lazyWithRetry(() => import("@/pages/HomeTemplatesPage"));
const CsvImportPage = lazyWithRetry(() => import("@/pages/CsvImportPage"));
const CloneBranchPage = lazyWithRetry(() => import("@/pages/CloneBranchPage"));
const BrandModulesPage = lazyWithRetry(() => import("@/pages/BrandModulesPage"));
const PaginaConfigurarGanhaGanha = lazyWithRetry(() => import("@/features/painel_modelos_negocio/pagina_configurar_ganha_ganha"));
const PaginaModelosPorCidadeBranch = lazyWithRetry(() => import("@/features/painel_modelos_negocio/pagina_modelos_por_cidade_branch"));
const PointsRulesPage = lazyWithRetry(() => import("@/pages/PointsRulesPage"));
const EarnPointsPage = lazyWithRetry(() => import("@/pages/EarnPointsPage"));
const PointsLedgerPage = lazyWithRetry(() => import("@/pages/PointsLedgerPage"));
const StorePointsRulePage = lazyWithRetry(() => import("@/pages/StorePointsRulePage"));
const ApproveStoreRulesPage = lazyWithRetry(() => import("@/pages/ApproveStoreRulesPage"));
const CustomerPreviewPage = lazyWithRetry(() => import("@/pages/CustomerPreviewPage"));
const PaginaLinks = lazyWithRetry(() => import("@/features/pagina_links/pagina_links"));
const StoreRegistrationWizard = lazyWithRetry(() => import("@/pages/StoreRegistrationWizard"));

const StoreOwnerPanel = lazyWithRetry(() => import("@/pages/StoreOwnerPanel"));
const AffiliateDealsPage = lazyWithRetry(() => import("@/pages/AffiliateDealsPage"));
const AffiliateCategoriesPage = lazyWithRetry(() => import("@/pages/AffiliateCategoriesPage"));
const StoreCatalogPage = lazyWithRetry(() => import("@/pages/StoreCatalogPage"));
const ReportsPage = lazyWithRetry(() => import("@/pages/ReportsPage"));
const SendNotificationPage = lazyWithRetry(() => import("@/pages/SendNotificationPage"));
const IconLibraryPage = lazyWithRetry(() => import("@/pages/IconLibraryPage"));
const BannerManagerPage = lazyWithRetry(() => import("@/pages/BannerManagerPage"));
const MenuLabelsPage = lazyWithRetry(() => import("@/pages/MenuLabelsPage"));
const PageBuilderPage = lazyWithRetry(() => import("@/pages/PageBuilderPage"));
const ProvisionBrandWizard = lazyWithRetry(() => import("@/pages/ProvisionBrandWizard"));
const BrandPermissionOverflowPage = lazyWithRetry(() => import("@/pages/BrandPermissionOverflowPage"));
const StarterKitConfigPage = lazyWithRetry(() => import("@/pages/StarterKitConfigPage"));
const EmitterRequestsPage = lazyWithRetry(() => import("@/pages/EmitterRequestsPage"));
const EmitterJourneyGuidePage = lazyWithRetry(() => import("@/pages/EmitterJourneyGuidePage"));
const PlatformThemePage = lazyWithRetry(() => import("@/pages/PlatformThemePage"));
const AppIconsConfigPage = lazyWithRetry(() => import("@/pages/AppIconsConfigPage"));
const WelcomeTourConfigPage = lazyWithRetry(() => import("@/pages/WelcomeTourConfigPage"));
const ProfileLinksConfigPage = lazyWithRetry(() => import("@/pages/ProfileLinksConfigPage"));
const GanhaGanhaConfigPage = lazyWithRetry(() => import("@/pages/GanhaGanhaConfigPage"));
const GanhaGanhaBillingPage = lazyWithRetry(() => import("@/pages/GanhaGanhaBillingPage"));
const GanhaGanhaRootDashboardPage = lazyWithRetry(() => import("@/pages/GanhaGanhaRootDashboardPage"));
const GanhaGanhaClosingReportsPage = lazyWithRetry(() => import("@/pages/GanhaGanhaClosingReportsPage"));
const GanhaGanhaStoreSummaryPage = lazyWithRetry(() => import("@/pages/GanhaGanhaStoreSummaryPage"));
const GanhaGanhaReportsPage = lazyWithRetry(() => import("@/pages/GanhaGanhaReportsPage"));
const StoreGanhaGanhaPage = lazyWithRetry(() => import("@/pages/StoreGanhaGanhaPage"));

const BrandApiKeysPage = lazyWithRetry(() => import("@/pages/BrandApiKeysPage"));
const ApiDocsPage = lazyWithRetry(() => import("@/pages/ApiDocsPage"));
const TrialSignupPage = lazyWithRetry(() => import("@/pages/TrialSignupPage"));
const SubscriptionPage = lazyWithRetry(() => import("@/pages/SubscriptionPage"));
const BrandSettingsPage = lazyWithRetry(() => import("@/pages/BrandSettingsPage"));
const SponsoredPlacementsPage = lazyWithRetry(() => import("@/pages/SponsoredPlacementsPage"));
const MachineIntegrationPage = lazyWithRetry(() => import("@/pages/MachineIntegrationPage"));
const MachineWebhookTestPage = lazyWithRetry(() => import("@/pages/MachineWebhookTestPage"));
const OfferCardConfigPage = lazyWithRetry(() => import("@/pages/OfferCardConfigPage"));
const PlanModuleTemplatesPage = lazyWithRetry(() => import("@/pages/PlanModuleTemplatesPage"));

const PaginaProdutosComerciais = lazyWithRetry(() => import("@/features/produtos_comerciais/pagina_produtos_comerciais"));
const PaginaAuditoriaDuplicacoes = lazyWithRetry(() => import("@/features/auditoria_duplicacoes/pagina_auditoria_duplicacoes"));
const PaginaLandingProduto = lazyWithRetry(() => import("@/features/landing_produto/pagina_landing_produto"));
const PaginaCatalogoProdutos = lazyWithRetry(() => import("@/features/catalogo_produtos/pagina_catalogo_produtos"));
const PaginaAgendarDemonstracao = lazyWithRetry(() => import("@/features/agendar_demonstracao/pagina_agendar_demonstracao"));
const PaginaLeadsComerciais = lazyWithRetry(() => import("@/features/leads_comerciais/pagina_leads_comerciais"));
const PaginaDetalhesLead = lazyWithRetry(() => import("@/features/leads_comerciais/pagina_detalhes_lead"));
const TierPointsRulesPage = lazyWithRetry(() => import("@/pages/TierPointsRulesPage"));
const DriverPointsRulesPage = lazyWithRetry(() => import("@/pages/DriverPointsRulesPage"));
const DriverManagementPage = lazyWithRetry(() => import("@/pages/DriverManagementPage"));
const DriverPointsPurchaseConfigPage = lazyWithRetry(() => import("@/features/compra_pontos_motorista/pagina_compra_pontos_config"));
const BranchWalletPage = lazyWithRetry(() => import("@/pages/BranchWalletPage"));
const BranchReportsPage = lazyWithRetry(() => import("@/pages/BranchReportsPage"));
const PaginaRelatorioCorridas = lazyWithRetry(() => import("@/features/relatorio_corridas/pagina_relatorio_corridas"));

const TaxonomyPage = lazyWithRetry(() => import("@/pages/TaxonomyPage"));
const CustomPage = lazyWithRetry(() => import("@/pages/customer/CustomPage"));
const WebviewPage = lazyWithRetry(() => import("@/pages/customer/WebviewPage"));
const PageBuilderV2Page = lazyWithRetry(() => import("@/pages/PageBuilderV2Page"));
const PublicVouchers = lazyWithRetry(() => import("@/pages/PublicVouchers"));
const LandingPage = lazyWithRetry(() => import("@/pages/LandingPage"));
const PartnerLandingPage = lazyWithRetry(() => import("@/pages/PartnerLandingPage"));
const PartnerLandingConfigPage = lazyWithRetry(() => import("@/pages/PartnerLandingConfigPage"));
const AccessHubPage = lazyWithRetry(() => import("@/pages/AccessHubPage"));
const CrmEmbedPage = lazyWithRetry(() => import("@/pages/CrmEmbedPage"));
const AchadinhosMobileImportPage = lazyWithRetry(() => import("@/pages/AchadinhosMobileImportPage"));
const MirrorSyncPage = lazyWithRetry(() => import("@/pages/MirrorSyncPage"));
const DriverPanelConfigPage = lazyWithRetry(() => import("@/pages/DriverPanelConfigPage"));
const DriverPanelPage = lazyWithRetry(() => import("@/pages/DriverPanelPage"));
const McpDashboardPage = lazyWithRetry(() => import("@/pages/McpDashboardPage"));
const OfferGovernancePage = lazyWithRetry(() => import("@/pages/OfferGovernancePage"));
const ProductRedemptionOrdersPage = lazyWithRetry(() => import("@/pages/ProductRedemptionOrdersPage"));
const PaginaCentralModulos = lazyWithRetry(() => import("@/features/central_modulos/pagina_central_modulos"));
const ProdutosResgatePage = lazyWithRetry(() => import("@/pages/ProdutosResgatePage"));
const RegrasResgatePage = lazyWithRetry(() => import("@/pages/RegrasResgatePage"));
const PaginaConversaoResgate = lazyWithRetry(() => import("@/pages/conversao_resgate/pagina_conversao_resgate"));
const ManuaisPage = lazyWithRetry(() => import("@/pages/ManuaisPage"));
const BrandBranchesPage = lazyWithRetry(() => import("@/pages/BrandBranchesPage"));
const BrandBranchForm = lazyWithRetry(() => import("@/pages/BrandBranchForm"));
const BrandCidadesJourneyPage = lazyWithRetry(() => import("@/pages/BrandCidadesJourneyPage"));
const BrandApiJourneyPage = lazyWithRetry(() => import("@/pages/BrandApiJourneyPage"));
const PaginaOnboardingCidade = lazyWithRetry(() => import("@/features/city_onboarding/pagina_onboarding_cidade"));
const PaginaConfiguracaoCidade = lazyWithRetry(() => import("@/features/configuracao_cidade/pagina_configuracao_cidade"));
const PaginaConfiguracaoModulosCidade = lazyWithRetry(() => import("@/features/configuracao_modulos_cidade/pagina_configuracao_modulos_cidade"));
const GamificacaoAdminPage = lazyWithRetry(() => import("@/pages/GamificacaoAdminPage"));
const PaginaPacotesPontos = lazyWithRetry(() => import("@/features/pacotes_pontos/pagina_pacotes_pontos"));
const PaginaLojaPacotes = lazyWithRetry(() => import("@/features/pacotes_pontos/pagina_loja_pacotes"));
const PaginaLojaPublica = lazyWithRetry(() => import("@/features/loja_publica/pagina_loja_publica"));
const InstallPwaPage = lazyWithRetry(() => import("@/pages/InstallPwaPage"));

// QueryClient is now centralized in src/lib/queryClient.ts
// Initialize event bus → query bridge for automatic cache invalidation
initEventBusQueryBridge(queryClient);

const PageLoader = forwardRef<HTMLDivElement>(function PageLoader(_props, ref) {
  return (
    <div ref={ref} className="min-h-[200px] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
});

function AnimatedRoutes() {
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
            <Route path="/mcp-dashboard" element={<McpDashboardPage />} />
            <Route path="/:slug/parceiro" element={<PartnerLandingPage />} />
            <Route path="/register-store" element={<StoreRegistrationWizard />} />
            <Route path="/loja/:slug" element={<PaginaLojaPublica />} />
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
              <Route path="points-packages" element={<PaginaPacotesPontos />} />
              <Route path="points-packages-store" element={<PaginaLojaPacotes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
  );
}

function PWABanners() {
  const { needRefresh, updateServiceWorker, dismissUpdate, canInstall, installApp, dismissInstall } = usePWA();

  return (
    <>
      {needRefresh && (
        <PWAUpdateBanner onUpdate={() => updateServiceWorker()} onDismiss={dismissUpdate} />
      )}
      {canInstall && !needRefresh && (
        <PWAInstallBanner onInstall={installApp} onDismiss={dismissInstall} />
      )}
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandProvider>
          <TooltipProvider>
            {/* MountSignal now in BootShell (main.tsx) for instant overlay dismissal */}
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppContent />
            </BrowserRouter>
            <PWABanners />
          </TooltipProvider>
        </BrandProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

const PORTAL_HOSTNAME = "app.valeresgate.com.br";

function AppContent() {
  const { isWhiteLabel, loading, brand } = useBrand();
  const { user, roles, loading: authLoading } = useAuth();
  const location = useLocation();

  const isPortalDomain = window.location.hostname === PORTAL_HOSTNAME;

  // Partner landing page is a public route that works regardless of white-label mode
  const isPartnerLanding = /^\/[^/]+\/parceiro\/?$/.test(location.pathname);
  const isDriverPanel = location.pathname === "/driver" || location.pathname.startsWith("/driver/");

  if (isPartnerLanding) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:slug/parceiro" element={<PartnerLandingPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (isDriverPanel) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DriverPanelPage />
      </Suspense>
    );
  }

  // Public paths that don't need brand resolution
  const publicPaths = ["/auth", "/reset-password", "/trial", "/landing", "/register-store", "/p/", "/driver", "/loja/"];
  const isPublicPath = publicPaths.some(p => location.pathname.startsWith(p));

  // Portal domain: redirect unauthenticated users to /auth immediately (before loading guard)
  if (isPortalDomain && !isPublicPath && !authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if ((loading || authLoading) && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Portal mode: app.valeresgate.com.br
  if (isPortalDomain && isWhiteLabel) {
    // Public paths always render normally
    if (isPublicPath) {
      return <AnimatedRoutes />;
    }

    // Not logged in → redirect to /auth
    if (!user || authLoading) {
      return <Navigate to="/auth" replace />;
    }

    // Logged in → check roles for routing
    const hasAdminRole = roles.some((r) =>
      ["root_admin", "tenant_admin", "brand_admin", "branch_admin", "branch_operator", "operator_pdv"].includes(r.role)
    );
    const isStoreOnly = !hasAdminRole && roles.some((r) => r.role === "store_admin");

    if (isStoreOnly && location.pathname === "/") {
      return <Navigate to="/store-panel" replace />;
    }

    if (hasAdminRole || isStoreOnly) {
      return <AnimatedRoutes />;
    }

    // Customer or no role → WhiteLabelLayout
    return <WhiteLabelLayout />;
  }

  if (isWhiteLabel) {
    // Smart routing: if authenticated admin for this brand, show admin panel
    if (user && !authLoading) {
      const isRoot = roles.some((r) => r.role === "root_admin");
      const isBrandAdmin = brand && roles.some(
        (r) => r.role === "brand_admin" && r.brand_id === brand.id
      );
      const isBranchAdmin = brand && roles.some(
        (r) => (r.role === "branch_admin" || r.role === "branch_operator" || r.role === "operator_pdv") && r.brand_id === brand.id
      );
      const isStoreAdmin = brand && roles.some(
        (r) => r.role === "store_admin" && r.brand_id === brand.id
      );
      if (isRoot || isBrandAdmin || isBranchAdmin || isStoreAdmin) {
        return <AnimatedRoutes />;
      }
    }

    // Auth page on white-label domain should still work
    if (isPublicPath) {
      return <AnimatedRoutes />;
    }

    return <WhiteLabelLayout />;
  }

  return <AnimatedRoutes />;
}

export default App;
