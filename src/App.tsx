import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
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
import VoucherRedeem from "@/pages/VoucherRedeem";
import UsersPage from "@/pages/UsersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
                <Route path="vouchers" element={<Vouchers />} />
                <Route path="vouchers/new" element={<VoucherForm />} />
                <Route path="vouchers/redeem" element={<VoucherRedeem />} />
                <Route path="vouchers/:id" element={<VoucherForm />} />
                <Route path="users" element={<UsersPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
