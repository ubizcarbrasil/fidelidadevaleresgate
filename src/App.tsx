// rebuild-trigger v2026-04-02a
import { Suspense, forwardRef, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandProvider, useBrand } from "@/contexts/BrandContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePWA } from "@/hooks/usePWA";
import PWAUpdateBanner from "@/components/pwa/PWAUpdateBanner";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleGuard from "@/components/ModuleGuard";
import RootGuard from "@/components/RootGuard";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";
import { queryClient } from "@/lib/queryClient";
import { initEventBusQueryBridge } from "@/lib/eventBusQueryBridge";
import {
  isPartnerLandingPath,
  isPortalDomain,
  isPublicPath,
  isOfertasPath,
  isDriverPath,
  shouldUseFastTrack,
} from "@/lib/routeConditions";
import {
  AppLayout,
  WhiteLabelLayout,
  NotFound,
  RootJourneyGuidePage,
  PaginaAdminOrigens,
  PaginaDiagnosticoMarca,
  BrandJourneyGuidePage,
  Auth,
  ResetPassword,
  Dashboard,
  Tenants,
  TenantForm,
  Brands,
  BrandForm,
  Branches,
  BranchForm,
  Vouchers,
  VoucherForm,
  VoucherWizardPage,
  VoucherRedeem,
  BrandDomains,
  PaginaDominiosMarca,
  UsersPage,
  StoresPage,
  OffersPage,
  CustomersPage,
  RedemptionsPage,
  SectionTemplatesPage,
  ModuleDefinitionsPage,
  FeatureFlagsPage,
  PermissionsPage,
  AuditLogsPage,
  ReleasesPage,
  OperatorRedeemPage,
  HomeTemplatesPage,
  CsvImportPage,
  CloneBranchPage,
  BrandModulesPage,
  PaginaConfigurarGanhaGanha,
  PaginaModelosPorCidadeBranch,
  PointsRulesPage,
  EarnPointsPage,
  PointsLedgerPage,
  StorePointsRulePage,
  ApproveStoreRulesPage,
  CustomerPreviewPage,
  PaginaLinks,
  StoreRegistrationWizard,
  PaginaHallDaFama,
  StoreOwnerPanel,
  AffiliateDealsPage,
  AffiliateCategoriesPage,
  StoreCatalogPage,
  ReportsPage,
  SendNotificationPage,
  IconLibraryPage,
  BannerManagerPage,
  MenuLabelsPage,
  PageBuilderPage,
  ProvisionBrandWizard,
  BrandPermissionOverflowPage,
  StarterKitConfigPage,
  EmitterRequestsPage,
  EmitterJourneyGuidePage,
  PlatformThemePage,
  AppIconsConfigPage,
  WelcomeTourConfigPage,
  ProfileLinksConfigPage,
  GanhaGanhaConfigPage,
  GanhaGanhaBillingPage,
  GanhaGanhaRootDashboardPage,
  GanhaGanhaClosingReportsPage,
  GanhaGanhaStoreSummaryPage,
  GanhaGanhaReportsPage,
  StoreGanhaGanhaPage,
  BrandApiKeysPage,
  ApiDocsPage,
  TrialSignupPage,
  SubscriptionPage,
  BrandSettingsPage,
  SponsoredPlacementsPage,
  MachineIntegrationPage,
  MachineWebhookTestPage,
  OfferCardConfigPage,
  PlanModuleTemplatesPage,
  PaginaProdutosComerciais,
  PaginaAuditoriaDuplicacoes,
  PaginaLandingProduto,
  PaginaCatalogoProdutos,
  PaginaAgendarDemonstracao,
  PaginaLeadsComerciais,
  PaginaDetalhesLead,
  TierPointsRulesPage,
  DriverPointsRulesPage,
  DriverManagementPage,
  DriverPointsPurchaseConfigPage,
  BranchWalletPage,
  BranchReportsPage,
  PaginaRelatorioCorridas,
  TaxonomyPage,
  CustomPage,
  WebviewPage,
  PageBuilderV2Page,
  PublicVouchers,
  LandingPage,
  PartnerLandingPage,
  PartnerLandingConfigPage,
  AccessHubPage,
  CrmEmbedPage,
  AchadinhosMobileImportPage,
  MirrorSyncPage,
  DriverPanelConfigPage,
  DriverPanelPage,
  RotaCampeonatoMotorista,
  PaginaCampeonatoStandalone,
  McpDashboardPage,
  OfferGovernancePage,
  ProductRedemptionOrdersPage,
  PaginaCentralModulos,
  ProdutosResgatePage,
  RegrasResgatePage,
  PaginaConversaoResgate,
  ManuaisPage,
  BrandBranchesPage,
  BrandBranchForm,
  BrandCidadesJourneyPage,
  BrandApiJourneyPage,
  PaginaOnboardingCidade,
  PaginaConfiguracaoCidade,
  PaginaConfiguracaoModulosCidade,
  GamificacaoAdminPage,
  PaginaPacotesPontos,
  PaginaLojaPacotes,
  PaginaLojaPublica,
  PaginaUbizOfertas,
  PaginaAdminUbizOfertas,
  InstallPwaPage,
} from "@/lib/lazyPages";

// QueryClient is now centralized in src/lib/queryClient.ts
// Initialize event bus → query bridge for automatic cache invalidation
initEventBusQueryBridge(queryClient);

const PageLoader = forwardRef<HTMLDivElement>(function PageLoader(_props, ref) {
  return (
    <div ref={ref}>
      <TelaCarregamentoInline />
    </div>
  );
});

/**
 * Short-circuit para a vitrine pública /ofertas e variantes (webview, /driver,
 * /motorista/campeonato). Pula AuthProvider/BrandProvider/Sentry para abrir
 * < 2s em in-app browsers (Instagram, Facebook, WhatsApp, iOS WebView), onde
 * getSession() pode travar.
 */
function OfertasFastTrack({ children }: { children: ReactNode }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const fastTrack = shouldUseFastTrack(pathname);

  if (!fastTrack) return <>{children}</>;

  const isCampeonatoMotorista = pathname === "/motorista/campeonato";

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/webview" element={<WebviewPage />} />
            <Route path="/ofertas" element={<PaginaUbizOfertas />} />
            <Route path="/driver" element={<DriverPanelPage />} />
            <Route path="/motorista/campeonato" element={<RotaCampeonatoMotorista />} />
            <Route path="*" element={isCampeonatoMotorista ? <RotaCampeonatoMotorista /> : <PaginaUbizOfertas />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  );
}

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
      <OfertasFastTrack>
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
      </OfertasFastTrack>
    </QueryClientProvider>
  </ErrorBoundary>
);

function AppContent() {
  const { isWhiteLabel, loading: _loading, brand } = useBrand();
  const { user, roles, loading: authLoading } = useAuth();
  const location = useLocation();

  const onPortal = isPortalDomain();
  const isPartnerLanding = isPartnerLandingPath(location.pathname);
  const isDriverPanel = isDriverPath(location.pathname);
  const isUbizOfertas = isOfertasPath(location.pathname);

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

  if (isUbizOfertas) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/ofertas" element={<PaginaUbizOfertas />} />
        </Routes>
      </Suspense>
    );
  }

  const onPublicPath = isPublicPath(location.pathname);

  // Portal domain: redirect unauthenticated users to /auth immediately (before loading guard)
  if (onPortal && !onPublicPath && !authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Não bloqueamos a árvore inteira aqui. ProtectedRoute e AppLayout
  // já mostram seu próprio loader/skeleton enquanto auth/brand resolvem,
  // o que evita o "flash" de full-screen loader em cada navegação interna.

  // Portal mode: app.valeresgate.com.br
  if (onPortal && isWhiteLabel) {
    if (onPublicPath) {
      return <AnimatedRoutes />;
    }

    if (!user || authLoading) {
      return <Navigate to="/auth" replace />;
    }

    const hasAdminRole = roles.some((r) =>
      ["root_admin", "tenant_admin", "brand_admin", "branch_admin", "branch_operator", "operator_pdv"].includes(r.role),
    );
    const isStoreOnly = !hasAdminRole && roles.some((r) => r.role === "store_admin");

    if (isStoreOnly && location.pathname === "/") {
      return <Navigate to="/store-panel" replace />;
    }

    if (hasAdminRole || isStoreOnly) {
      return <AnimatedRoutes />;
    }

    return <WhiteLabelLayout />;
  }

  if (isWhiteLabel) {
    if (user && !authLoading) {
      const isRoot = roles.some((r) => r.role === "root_admin");
      const isBrandAdmin =
        brand && roles.some((r) => r.role === "brand_admin" && r.brand_id === brand.id);
      const isBranchAdmin =
        brand &&
        roles.some(
          (r) =>
            (r.role === "branch_admin" || r.role === "branch_operator" || r.role === "operator_pdv") &&
            r.brand_id === brand.id,
        );
      const isStoreAdmin =
        brand && roles.some((r) => r.role === "store_admin" && r.brand_id === brand.id);
      if (isRoot || isBrandAdmin || isBranchAdmin || isStoreAdmin) {
        return <AnimatedRoutes />;
      }
    }

    if (onPublicPath) {
      return <AnimatedRoutes />;
    }

    return <WhiteLabelLayout />;
  }

  return <AnimatedRoutes />;
}

export default App;
