import { Outlet, Navigate } from "react-router-dom";
import TrialBanner from "@/components/TrialBanner";
import TrialExpiredBlocker from "@/components/TrialExpiredBlocker";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { RootSidebar } from "@/components/consoles/RootSidebar";
import { TenantSidebar } from "@/components/consoles/TenantSidebar";
import { BrandSidebar } from "@/components/consoles/BrandSidebar";
import { BranchSidebar } from "@/components/consoles/BranchSidebar";
import { OperatorSidebar } from "@/components/consoles/OperatorSidebar";
import { ContextualHelpDrawer } from "@/components/ContextualHelpDrawer";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ContextBadge } from "@/components/ContextBadge";

const CONSOLE_TITLES: Record<string, string> = {
  ROOT: "Painel Raiz",
  TENANT: "Painel da Empresa",
  BRAND: "Painel da Marca",
  BRANCH: "Painel da Filial",
  OPERATOR: "Operador do Ponto de Venda",
  STORE_ADMIN: "Portal do Parceiro",
};

export default function AppLayout() {
  const { consoleScope, isRootAdmin } = useBrandGuard();
  const { name: brandName, logoUrl: brandLogoUrl } = useBrandInfo();
  const [platformTheme, setPlatformTheme] = useState<Json | null>(null);
  const isImpersonating = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return isRootAdmin && !!params.get("brandId");
  }, [isRootAdmin]);

  useEffect(() => {
    supabase
      .from("platform_config")
      .select("value_json")
      .eq("key", "platform_theme")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) setPlatformTheme(data.value_json);
      });
  }, []);

  useBrandTheme(platformTheme);

  // Parceiros usam o portal dedicado
  if (consoleScope === "STORE_ADMIN") {
    return <Navigate to="/store-panel" replace />;
  }

  const SidebarComponent = {
    ROOT: RootSidebar,
    TENANT: TenantSidebar,
    BRAND: BrandSidebar,
    BRANCH: BranchSidebar,
    OPERATOR: OperatorSidebar,
  }[consoleScope];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarComponent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-3 sm:px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-2 sm:mr-4" />
            {isImpersonating && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 mr-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => { window.location.href = "/"; }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Voltar ao Painel Raiz</span>
                <span className="sm:hidden">Raiz</span>
              </Button>
            )}
            {brandLogoUrl && (
              <img src={brandLogoUrl} alt={brandName} className="h-7 w-7 shrink-0 rounded-md object-cover mr-2" />
            )}
            <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">{brandName || "Plataforma"} — {CONSOLE_TITLES[consoleScope]}</h1>
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto">
            <TrialBanner />
            <Outlet />
          </main>
          <TrialExpiredBlocker />
          <ContextualHelpDrawer />
        </div>
      </div>
    </SidebarProvider>
  );
}
