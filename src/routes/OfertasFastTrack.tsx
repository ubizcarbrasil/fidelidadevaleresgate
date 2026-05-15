import { Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { shouldUseFastTrack } from "@/lib/routeConditions";
import {
  DriverPanelPage,
  PaginaUbizOfertas,
  RotaCampeonatoMotorista,
  WebviewPage,
} from "@/lib/lazyPages";
import { PageLoader } from "./PageLoader";

/**
 * Short-circuit para a vitrine pública /ofertas e variantes (webview, /driver,
 * /motorista/campeonato). Pula AuthProvider/BrandProvider/Sentry para abrir
 * < 2s em in-app browsers (Instagram, Facebook, WhatsApp, iOS WebView), onde
 * getSession() pode travar.
 *
 * Se o pathname não casar com nenhuma rota de fast-track, renderiza
 * `children` (a árvore normal com providers de auth/brand).
 */
export function OfertasFastTrack({ children }: { children: ReactNode }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  if (!shouldUseFastTrack(pathname)) return <>{children}</>;

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
            <Route
              path="*"
              element={isCampeonatoMotorista ? <RotaCampeonatoMotorista /> : <PaginaUbizOfertas />}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  );
}
