import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useBrand } from "@/contexts/BrandContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleGuard from "@/components/ModuleGuard";
import AppLayout from "@/components/AppLayout";
import WhiteLabelLayout from "@/components/WhiteLabelLayout";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import RootJourneyGuidePage from "@/pages/RootJourneyGuidePage";
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
const GanhaGanhaConfigPage = lazy(() => import("@/pages/GanhaGanhaConfigPage"));
const GanhaGanhaBillingPage = lazy(() => import("@/pages/GanhaGanhaBillingPage"));
const GanhaGanhaRootDashboardPage = lazy(() => import("@/pages/GanhaGanhaRootDashboardPage"));
const GanhaGanhaClosingReportsPage = lazy(() => import("@/pages/GanhaGanhaClosingReportsPage"));
const BrandApiKeysPage = lazy(() => import("@/pages/BrandApiKeysPage"));
const ApiDocsPage = lazy(() => import("@/pages/ApiDocsPage"));
const TrialSignupPage = lazy(() => import("@/pages/TrialSignupPage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));

const TaxonomyPage = lazy(() => import("@/pages/TaxonomyPage"));
const CustomPage = lazy(() => import("@/pages/customer/CustomPage"));
const WebviewPage = lazy(() => import("@/pages/customer/WebviewPage"));
const PageBuilderV2Page = lazy(() => import("@/pages/PageBuilderV2Page"));
const PublicVouchers = lazy(() => import("@/pages/PublicVouchers"));

const queryClient = new QueryClient();

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
          <Route path="domains" element={<BrandDomains />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="stores" element={<ModuleGuard moduleKey="stores"><StoresPage /></ModuleGuard>} />
          <Route path="offers" element={<ModuleGuard moduleKey="offers"><OffersPage /></ModuleGuard>} />
          <Route path="customers" element={<ModuleGuard moduleKey="wallet"><CustomersPage /></ModuleGuard>} />
          <Route path="redemptions" element={<ModuleGuard moduleKey="redemption_qr"><RedemptionsPage /></ModuleGuard>} />
          <Route path="templates" element={<ModuleGuard moduleKey="home_sections"><SectionTemplatesPage /></ModuleGuard>} />
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
          <Route path="store-catalog" element={<ModuleGuard moduleKey="stores"><StoreCatalogPage /></ModuleGuard>} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="send-notification" element={<SendNotificationPage />} />
          <Route path="icon-library" element={<IconLibraryPage />} />
          <Route path="banner-manager" element={<BannerManagerPage />} />
          <Route path="menu-labels" element={<MenuLabelsPage />} />
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
          <Route path="ganha-ganha-config" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaConfigPage /></ModuleGuard>} />
          <Route path="ganha-ganha-billing" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaBillingPage /></ModuleGuard>} />
          <Route path="ganha-ganha-closing" element={<ModuleGuard moduleKey="ganha_ganha"><GanhaGanhaClosingReportsPage /></ModuleGuard>} />
          <Route path="ganha-ganha-dashboard" element={<GanhaGanhaRootDashboardPage />} />
          <Route path="api-keys" element={<BrandApiKeysPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
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
