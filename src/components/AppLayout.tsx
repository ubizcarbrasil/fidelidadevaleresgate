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
import { ApiKeyOnboardingDialog } from "@/components/ApiKeyOnboardingDialog";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Bell, ChevronDown } from "lucide-react";
import { ContextBadge } from "@/components/ContextBadge";
import BranchSelector from "@/components/BranchSelector";

export default function AppLayout() {
  const { consoleScope, isRootAdmin } = useBrandGuard();
  const { name: brandName, logoUrl: brandLogoUrl, brandId } = useBrandInfo();
  const { user } = useAuth();
  const [platformTheme, setPlatformTheme] = useState<Json | null>(null);
  const [showApiKeyOnboarding, setShowApiKeyOnboarding] = useState(false);
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

  useEffect(() => {
    if (consoleScope !== "BRAND" || !brandId) return;
    supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", brandId)
      .single()
      .then(({ data }) => {
        const settings = data?.brand_settings_json as Record<string, any> | null;
        if (settings && !settings.api_key_onboarding_seen) {
          setShowApiKeyOnboarding(true);
        }
      });
  }, [consoleScope, brandId]);

  useBrandTheme(platformTheme);

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

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "?";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarComponent />
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Premium Topbar ── */}
          <header className="h-14 flex items-center gap-3 px-4 saas-topbar shrink-0 relative z-10">
            <SidebarTrigger className="mr-1" />

            {isImpersonating && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => { window.location.href = "/"; }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Voltar ao Painel Raiz</span>
              </Button>
            )}

            {/* Search */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="h-8 pl-9 text-xs bg-accent/50 border-border/50 focus:bg-accent"
              />
            </div>

            <div className="flex-1" />

            {/* Branch selector */}
            <div className="hidden sm:block">
              <BranchSelector />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{initials}</span>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{user?.email?.split("@")[0]}</span>
                <span className="text-[10px] text-muted-foreground">{brandName || "Admin"}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </div>

            <div className="ml-auto shrink-0 md:hidden">
              <ContextBadge mode="admin" brandName={brandName || undefined} impersonating={isImpersonating} />
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <TrialBanner />
            <Outlet />
          </main>
          <TrialExpiredBlocker />
          <ContextualHelpDrawer />
          {showApiKeyOnboarding && brandId && (
            <ApiKeyOnboardingDialog
              open={showApiKeyOnboarding}
              onDismiss={() => setShowApiKeyOnboarding(false)}
              brandId={brandId}
            />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
