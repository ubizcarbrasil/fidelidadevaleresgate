import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useBrand } from "@/contexts/BrandContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleGuard from "@/components/ModuleGuard";
import RootGuard from "@/components/RootGuard";
import AppLayout from "@/components/AppLayout";
import WhiteLabelLayout from "@/components/WhiteLabelLayout";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import RootJourneyGuidePage from "@/pages/RootJourneyGuidePage";
import { queryClient } from "@/lib/queryClient";
import { initEventBusQueryBridge } from "@/lib/eventBusQueryBridge";
const BrandJourneyGuidePage = lazy(() => import("@/pages/BrandJourneyGuidePage"));

// Lazy-loaded pages
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Tenants = lazy(() => import("@/pages/Tenants"));
const TenantForm = lazy(() => import("@/pages/TenantForm"));
const Brands = lazy(() => import("@/pages/Brands"));
const BrandForm = lazy(() => import("@/pages/BrandForm"));
const Branches = lazy(() => import("@/pages/Branches"));
const BranchForm = lazy(() => import("@/pages/BranchForm"));
const Vouchers = lazy(() => import("@/pages/Vouchers"));
const VoucherForm = lazy(() => import("@/pages/VoucherForm"));
const VoucherWizardPage = lazy(() => import("@/pages/VoucherWizardPage"));
const VoucherRedeem = lazy(() => import("@/pages/VoucherRedeem"));
const BrandDomains = lazy(() => import("@/pages/BrandDomains"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const StoresPage = lazy(() => import("@/pages/StoresPage"));
const OffersPage = lazy(() => import("@/pages/OffersPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const RedemptionsPage = lazy(() => import("@/pages/RedemptionsPage"));
const SectionTemplatesPage = lazy(() => import("@/pages/SectionTemplatesPage"));
const ModuleDefinitionsPage = lazy(() => import("@/pages/ModuleDefinitionsPage"));
const FeatureFlagsPage = lazy(() => import("@/pages/FeatureFlagsPage"));
const PermissionsPage = lazy(() => import("@/pages/PermissionsPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const ReleasesPage = lazy(() => import("@/pages/ReleasesPage"));
const OperatorRedeemPage = lazy(() => import("@/pages/OperatorRedeemPage"));
const HomeTemplatesPage = lazy(() => import("@/pages/HomeTemplatesPage"));
const CsvImportPage = lazy(() => import("@/pages/CsvImportPage"));
const CloneBranchPage = lazy(() => import("@/pages/CloneBranchPage"));
const BrandModulesPage = lazy(() => import("@/pages/BrandModulesPage"));
const PointsRulesPage = lazy(() => import("@/pages/PointsRulesPage"));
const EarnPointsPage = lazy(() => import("@/pages/EarnPointsPage"));
const PointsLedgerPage = lazy(() => import("@/pages/PointsLedgerPage"));
const StorePointsRulePage = lazy(() => import("@/pages/StorePointsRulePage"));
const ApproveStoreRulesPage = lazy(() => import("@/pages/ApproveStoreRulesPage"));
const CustomerPreviewPage = lazy(() => import("@/pages/CustomerPreviewPage"));
const StoreRegistrationWizard = lazy(() => import("@/pages/StoreRegistrationWizard"));
const StoreApprovalsPage = lazy(() => import("@/pages/StoreApprovalsPage"));
const StoreOwnerPanel = lazy(() => import("@/pages/StoreOwnerPanel"));
const AffiliateDealsPage = lazy(() => import("@/pages/AffiliateDealsPage"));
const AffiliateCategoriesPage = lazy(() => import("@/pages/AffiliateCategoriesPage"));
const StoreCatalogPage = lazy(() => import("@/pages/StoreCatalogPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const SendNotificationPage = lazy(() => import("@/pages/SendNotificationPage"));
const IconLibraryPage = lazy(() => import("@/pages/IconLibraryPage"));
const BannerManagerPage = lazy(() => import("@/pages/BannerManagerPage"));
const MenuLabelsPage = lazy(() => import("@/pages/MenuLabelsPage"));
const PageBuilderPage = lazy(() => import("@/pages/PageBuilderPage"));
const ProvisionBrandWizard = lazy(() => import("@/pages/ProvisionBrandWizard"));
const BrandPermissionOverflowPage = lazy(() => import("@/pages/BrandPermissionOverflowPage"));
const StarterKitConfigPage = lazy(() => import("@/pages/StarterKitConfigPage"));
const EmitterRequestsPage = lazy(() => import("@/pages/EmitterRequestsPage"));
const EmitterJourneyGuidePage = lazy(() => import("@/pages/EmitterJourneyGuidePage"));
const PlatformThemePage = lazy(() => import("@/pages/PlatformThemePage"));
const AppIconsConfigPage = lazy(() => import("@/pages/AppIconsConfigPage"));
const WelcomeTourConfigPage = lazy(() => import("@/pages/WelcomeTourConfigPage"));
const ProfileLinksConfigPage = lazy(() => import("@/pages/ProfileLinksConfigPage"));
const GanhaGanhaConfigPage = lazy(() => import("@/pages/GanhaGanhaConfigPage"));
const GanhaGanhaBillingPage = lazy(() => import("@/pages/GanhaGanhaBillingPage"));
const GanhaGanhaRootDashboardPage = lazy(() => import("@/pages/GanhaGanhaRootDashboardPage"));
const GanhaGanhaClosingReportsPage = lazy(() => import("@/pages/GanhaGanhaClosingReportsPage"));
const BrandApiKeysPage = lazy(() => import("@/pages/BrandApiKeysPage"));
const ApiDocsPage = lazy(() => import("@/pages/ApiDocsPage"));
const TrialSignupPage = lazy(() => import("@/pages/TrialSignupPage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const BrandSettingsPage = lazy(() => import("@/pages/BrandSettingsPage"));

const TaxonomyPage = lazy(() => import("@/pages/TaxonomyPage"));
const CustomPage = lazy(() => import("@/pages/customer/CustomPage"));
const WebviewPage = lazy(() => import("@/pages/customer/WebviewPage"));
const PageBuilderV2Page = lazy(() => import("@/pages/PageBuilderV2Page"));
const PublicVouchers = lazy(() => import("@/pages/PublicVouchers"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PartnerLandingPage = lazy(() => import("@/pages/PartnerLandingPage"));
const PartnerLandingConfigPage = lazy(() => import("@/pages/PartnerLandingConfigPage"));
const AccessHubPage = lazy(() => import("@/pages/AccessHubPage"));
const CrmDashboardPage = lazy(() => import("@/pages/CrmDashboardPage"));
const CrmLostCustomersPage = lazy(() => import("@/pages/CrmLostCustomersPage"));
const CrmPotentialCustomersPage = lazy(() => import("@/pages/CrmPotentialCustomersPage"));
const CrmCustomersPage = lazy(() => import("@/pages/CrmCustomersPage"));
const CrmParetoPage = lazy(() => import("@/pages/CrmParetoPage"));
const CrmOpportunitiesPage = lazy(() => import("@/pages/CrmOpportunitiesPage"));
const CrmJourneyPage = lazy(() => import("@/pages/CrmJourneyPage"));
const CrmContactsPage = lazy(() => import("@/pages/CrmContactsPage"));
const CrmTierPage = lazy(() => import("@/pages/CrmTierPage"));
const CrmAudiencesPage = lazy(() => import("@/pages/CrmAudiencesPage"));
const CrmCampaignsPage = lazy(() => import("@/pages/CrmCampaignsPage"));
const CrmAnalyticsPage = lazy(() => import("@/pages/CrmAnalyticsPage"));

// QueryClient is now centralized in src/lib/queryClient.ts
// Initialize event bus → query bridge for automatic cache invalidation
initEventBusQueryBridge(queryClient);

function PageLoader() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/customer-preview" element={<CustomerPreviewPage />} />
        <Route path="/webview" element={<WebviewPage />} />
        <Route path="/p/:slug" element={<CustomPage />} />
        <Route path="/trial" element={<TrialSignupPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/:slug/parceiro" element={<PartnerLandingPage />} />
        <Route path="/register-store" element={<ProtectedRoute><StoreRegistrationWizard /></ProtectedRoute>} />
        <Route path="/store-panel" element={<ProtectedRoute><StoreOwnerPanel /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
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
          <Route path="users" element={<UsersPage />} />
          <Route path="stores" element={<ModuleGuard moduleKey="stores"><StoresPage /></ModuleGuard>} />
          <Route path="offers" element={<ModuleGuard moduleKey="offers"><OffersPage /></ModuleGuard>} />
          <Route path="customers" element={<ModuleGuard moduleKey="wallet"><CustomersPage /></ModuleGuard>} />
          <Route path="redemptions" element={<ModuleGuard moduleKey="redemption_qr"><RedemptionsPage /></ModuleGuard>} />
          <Route path="templates" element={<RootGuard><SectionTemplatesPage /></RootGuard>} />
          <Route path="modules" element={<ModuleDefinitionsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="flags" element={<FeatureFlagsPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="releases" element={<ReleasesPage />} />
          <Route path="home-templates" element={<HomeTemplatesPage />} />
          <Route path="csv-import" element={<ModuleGuard moduleKey="stores"><CsvImportPage /></ModuleGuard>} />
          <Route path="clone-branch" element={<CloneBranchPage />} />
          <Route path="brand-modules" element={<BrandModulesPage />} />
          <Route path="pdv" element={<OperatorRedeemPage />} />
          <Route path="points-rules" element={<ModuleGuard moduleKey="earn_points_store"><PointsRulesPage /></ModuleGuard>} />
          <Route path="earn-points" element={<ModuleGuard moduleKey="earn_points_store"><EarnPointsPage /></ModuleGuard>} />
          <Route path="points-ledger" element={<ModuleGuard moduleKey="earn_points_store"><PointsLedgerPage /></ModuleGuard>} />
          <Route path="store-points-rule" element={<ModuleGuard moduleKey="earn_points_store"><StorePointsRulePage /></ModuleGuard>} />
          <Route path="approve-store-rules" element={<ModuleGuard moduleKey="earn_points_store"><ApproveStoreRulesPage /></ModuleGuard>} />
          <Route path="store-approvals" element={<StoreApprovalsPage />} />
          <Route path="affiliate-deals" element={<AffiliateDealsPage />} />
          <Route path="affiliate-categories" element={<AffiliateCategoriesPage />} />
          <Route path="store-catalog" element={<ModuleGuard moduleKey="stores"><StoreCatalogPage /></ModuleGuard>} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="send-notification" element={<SendNotificationPage />} />
          <Route path="icon-library" element={<IconLibraryPage />} />
          <Route path="banner-manager" element={<BannerManagerPage />} />
          <Route path="menu-labels" element={<RootGuard><MenuLabelsPage /></RootGuard>} />
          <Route path="page-builder" element={<PageBuilderPage />} />
          <Route path="page-builder-v2" element={<PageBuilderV2Page />} />
          <Route path="public-vouchers" element={<PublicVouchers />} />
          
          <Route path="provision-brand" element={<ProvisionBrandWizard />} />
          <Route path="brand-permissions" element={<BrandPermissionOverflowPage />} />
          <Route path="taxonomy" element={<TaxonomyPage />} />
          <Route path="starter-kit" element={<StarterKitConfigPage />} />
          <Route path="emitter-requests" element={<EmitterRequestsPage />} />
          <Route path="root-journey" element={<RootJourneyGuidePage />} />
          <Route path="brand-journey" element={<BrandJourneyGuidePage />} />
          <Route path="emitter-journey" element={<EmitterJourneyGuidePage />} />
          <Route path="platform-theme" element={<PlatformThemePage />} />
          <Route path="app-icons" element={<AppIconsConfigPage />} />
          <Route path="welcome-tour" element={<WelcomeTourConfigPage />} />
          <Route path="profile-links" element={<ProfileLinksConfigPage />} />
          <Route path="ganha-ganha-config" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaConfigPage /></ModuleGuard>} />
          <Route path="ganha-ganha-billing" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaBillingPage /></ModuleGuard>} />
          <Route path="ganha-ganha-closing" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaClosingReportsPage /></ModuleGuard>} />
          <Route path="ganha-ganha-dashboard" element={<GanhaGanhaRootDashboardPage />} />
          <Route path="api-keys" element={<BrandApiKeysPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="partner-landing-config" element={<PartnerLandingConfigPage />} />
          <Route path="access-hub" element={<AccessHubPage />} />
          <Route path="brand-settings" element={<BrandSettingsPage />} />
          <Route path="crm" element={<ModuleGuard moduleKey="crm"><CrmDashboardPage /></ModuleGuard>} />
          <Route path="crm/customers" element={<ModuleGuard moduleKey="crm"><CrmCustomersPage /></ModuleGuard>} />
          <Route path="crm/opportunities" element={<ModuleGuard moduleKey="crm"><CrmOpportunitiesPage /></ModuleGuard>} />
          <Route path="crm/pareto" element={<ModuleGuard moduleKey="crm"><CrmParetoPage /></ModuleGuard>} />
          <Route path="crm/journey" element={<ModuleGuard moduleKey="crm"><CrmJourneyPage /></ModuleGuard>} />
          <Route path="crm/lost" element={<ModuleGuard moduleKey="crm"><CrmLostCustomersPage /></ModuleGuard>} />
          <Route path="crm/potential" element={<ModuleGuard moduleKey="crm"><CrmPotentialCustomersPage /></ModuleGuard>} />
          <Route path="crm/contacts" element={<ModuleGuard moduleKey="crm"><CrmContactsPage /></ModuleGuard>} />
          <Route path="crm/tiers" element={<ModuleGuard moduleKey="crm"><CrmTierPage /></ModuleGuard>} />
          <Route path="crm/audiences" element={<ModuleGuard moduleKey="crm"><CrmAudiencesPage /></ModuleGuard>} />
          <Route path="crm/campaigns" element={<ModuleGuard moduleKey="crm"><CrmCampaignsPage /></ModuleGuard>} />
          <Route path="crm/analytics" element={<ModuleGuard moduleKey="crm"><CrmAnalyticsPage /></ModuleGuard>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </BrandProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

function AppContent() {
  const { isWhiteLabel, loading } = useBrand();
  const location = useLocation();

  // Partner landing page is a public route that works regardless of white-label mode
  const isPartnerLanding = /^\/[^/]+\/parceiro\/?$/.test(location.pathname);

  if (isPartnerLanding) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:slug/parceiro" element={<PartnerLandingPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isWhiteLabel) {
    return <WhiteLabelLayout />;
  }

  return <AppRoutes />;
}

export default App;
