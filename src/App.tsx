// rebuild-trigger v2026-04-02a
import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandProvider, useBrand } from "@/contexts/BrandContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePWA } from "@/hooks/usePWA";
import PWAUpdateBanner from "@/components/pwa/PWAUpdateBanner";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";
import { queryClient } from "@/lib/queryClient";
import { initEventBusQueryBridge } from "@/lib/eventBusQueryBridge";
import {
  isDriverPath,
  isOfertasPath,
  isPartnerLandingPath,
  isPortalDomain,
  isPublicPath,
} from "@/lib/routeConditions";
import {
  DriverPanelPage,
  PaginaUbizOfertas,
  PartnerLandingPage,
  WhiteLabelLayout,
} from "@/lib/lazyPages";
import { AnimatedRoutes } from "@/routes/AnimatedRoutes";
import { OfertasFastTrack } from "@/routes/OfertasFastTrack";
import { PageLoader } from "@/routes/PageLoader";

// Initialize event bus → query bridge for automatic cache invalidation
initEventBusQueryBridge(queryClient);

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

/**
 * Orquestrador de roteamento: decide entre overrides públicos (parceiro/
 * driver/ofertas), o portal app.valeresgate.com.br e o modo white-label.
 *
 * Mantemos a lógica aqui (e não em <AnimatedRoutes/>) porque as decisões
 * dependem de `useBrand()` e `useAuth()`, que só ficam disponíveis dentro
 * dos providers montados em <App/>.
 */
function AppContent() {
  const { isWhiteLabel, brand } = useBrand();
  const { user, roles, loading: authLoading } = useAuth();
  const location = useLocation();

  if (isPartnerLandingPath(location.pathname)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:slug/parceiro" element={<PartnerLandingPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (isDriverPath(location.pathname)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DriverPanelPage />
      </Suspense>
    );
  }

  if (isOfertasPath(location.pathname)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/ofertas" element={<PaginaUbizOfertas />} />
        </Routes>
      </Suspense>
    );
  }

  const onPortal = isPortalDomain();
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
    if (onPublicPath) return <AnimatedRoutes />;

    if (!user || authLoading) return <Navigate to="/auth" replace />;

    const hasAdminRole = roles.some((r) =>
      ["root_admin", "tenant_admin", "brand_admin", "branch_admin", "branch_operator", "operator_pdv"].includes(r.role),
    );
    const isStoreOnly = !hasAdminRole && roles.some((r) => r.role === "store_admin");

    if (isStoreOnly && location.pathname === "/") {
      return <Navigate to="/store-panel" replace />;
    }

    if (hasAdminRole || isStoreOnly) return <AnimatedRoutes />;

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

    if (onPublicPath) return <AnimatedRoutes />;

    return <WhiteLabelLayout />;
  }

  return <AnimatedRoutes />;
}

export default App;
