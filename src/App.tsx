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
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Tenants from "@/pages/Tenants";
import TenantForm from "@/pages/TenantForm";
import Brands from "@/pages/Brands";
import BrandForm from "@/pages/BrandForm";
import Branches from "@/pages/Branches";
import BranchForm from "@/pages/BranchForm";
import Vouchers from "@/pages/Vouchers";
import VoucherForm from "@/pages/VoucherForm";
import VoucherWizardPage from "@/pages/VoucherWizardPage";
import VoucherRedeem from "@/pages/VoucherRedeem";
import BrandDomains from "@/pages/BrandDomains";
import UsersPage from "@/pages/UsersPage";
import StoresPage from "@/pages/StoresPage";
import OffersPage from "@/pages/OffersPage";
import CustomersPage from "@/pages/CustomersPage";
import RedemptionsPage from "@/pages/RedemptionsPage";
import SectionTemplatesPage from "@/pages/SectionTemplatesPage";
import ModuleDefinitionsPage from "@/pages/ModuleDefinitionsPage";
import FeatureFlagsPage from "@/pages/FeatureFlagsPage";
import PermissionsPage from "@/pages/PermissionsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import ReleasesPage from "@/pages/ReleasesPage";
import OperatorRedeemPage from "@/pages/OperatorRedeemPage";
import HomeTemplatesPage from "@/pages/HomeTemplatesPage";
import CsvImportPage from "@/pages/CsvImportPage";
import CloneBranchPage from "@/pages/CloneBranchPage";
import BrandModulesPage from "@/pages/BrandModulesPage";
import PointsRulesPage from "@/pages/PointsRulesPage";
import EarnPointsPage from "@/pages/EarnPointsPage";
import PointsLedgerPage from "@/pages/PointsLedgerPage";
import StorePointsRulePage from "@/pages/StorePointsRulePage";
import ApproveStoreRulesPage from "@/pages/ApproveStoreRulesPage";
import CustomerPreviewPage from "@/pages/CustomerPreviewPage";
import StoreRegistrationWizard from "@/pages/StoreRegistrationWizard";
import StoreApprovalsPage from "@/pages/StoreApprovalsPage";
import StoreOwnerPanel from "@/pages/StoreOwnerPanel";
import AffiliateDealsPage from "@/pages/AffiliateDealsPage";
import StoreCatalogPage from "@/pages/StoreCatalogPage";
import ReportsPage from "@/pages/ReportsPage";
import SendNotificationPage from "@/pages/SendNotificationPage";
import IconLibraryPage from "@/pages/IconLibraryPage";
import BannerManagerPage from "@/pages/BannerManagerPage";
import MenuLabelsPage from "@/pages/MenuLabelsPage";
import PageBuilderPage from "@/pages/PageBuilderPage";
import ProvisionBrandWizard from "@/pages/ProvisionBrandWizard";
import BrandPermissionOverflowPage from "@/pages/BrandPermissionOverflowPage";
import StarterKitConfigPage from "@/pages/StarterKitConfigPage";
import EmitterRequestsPage from "@/pages/EmitterRequestsPage";
import RootJourneyGuidePage from "@/pages/RootJourneyGuidePage";

import TaxonomyPage from "@/pages/TaxonomyPage";
import CustomPage from "@/pages/customer/CustomPage";
import WebviewPage from "@/pages/customer/WebviewPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/customer-preview" element={<CustomerPreviewPage />} />
      <Route path="/webview" element={<WebviewPage />} />
      <Route path="/p/:slug" element={<CustomPage />} />
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
        
        <Route path="provision-brand" element={<ProvisionBrandWizard />} />
        <Route path="brand-permissions" element={<BrandPermissionOverflowPage />} />
        <Route path="taxonomy" element={<TaxonomyPage />} />
        <Route path="starter-kit" element={<StarterKitConfigPage />} />
        <Route path="emitter-requests" element={<EmitterRequestsPage />} />
        <Route path="root-journey" element={<RootJourneyGuidePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
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
