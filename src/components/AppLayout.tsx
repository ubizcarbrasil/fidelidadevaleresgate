import { Outlet, Navigate, useLocation } from "react-router-dom";
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
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Bell, ChevronDown, ChevronRight, LogOut, User, KeyRound } from "lucide-react";
import { ContextBadge } from "@/components/ContextBadge";
import BranchSelector from "@/components/BranchSelector";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/": "Visão Geral",
  "/branches": "Cidades",
  "/brands": "Aparência",
  "/offers": "Ofertas",
  "/redemptions": "Resgates",
  "/vouchers": "Cupons",
  "/stores": "Parceiros",
  "/customers": "Clientes",
  "/reports": "Relatórios",
  "/crm": "CRM",
  "/users": "Usuários",
  "/audit": "Auditoria",
  "/brand-settings": "Configurações",
  "/brand-modules": "Módulos",
  "/points-rules": "Regras de Fidelidade",
  "/earn-points": "Pontuar",
  "/points-ledger": "Extrato",
  "/api-keys": "APIs",
  "/api-docs": "Documentação API",
};

function useBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Visão Geral", href: "/" }];
  const crumbs = [{ label: "Início", href: "/" }];
  let accumulated = "";
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = routeLabels[accumulated] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    crumbs.push({ label, href: accumulated });
  }
  return crumbs;
}

export default function AppLayout() {
  const { consoleScope, isRootAdmin } = useBrandGuard();
  const { name: brandName, logoUrl: brandLogoUrl, brandId } = useBrandInfo();
  const { user, signOut } = useAuth();
  const [platformTheme, setPlatformTheme] = useState<Json | null>(null);
  const [showApiKeyOnboarding, setShowApiKeyOnboarding] = useState(false);
  
  const bellRef = useRef<HTMLButtonElement>(null);
  const crumbs = useBreadcrumbs();

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

  // Bell ring animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      bellRef.current?.classList.add("bell-ring");
      setTimeout(() => bellRef.current?.classList.remove("bell-ring"), 900);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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

            {/* Breadcrumb */}
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {crumbs.map((crumb, i) => (
                  <BreadcrumbItem key={crumb.href}>
                    {i < crumbs.length - 1 ? (
                      <>
                        <BreadcrumbLink href={crumb.href} className="text-xs">{crumb.label}</BreadcrumbLink>
                        <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
                      </>
                    ) : (
                      <BreadcrumbPage className="text-xs font-medium">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Search with Cmd+K hint */}
            <div className="relative hidden lg:block w-64 ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="h-8 pl-9 pr-12 text-xs bg-accent/50 border-border/50 focus:bg-accent"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-muted-foreground/60 border border-border/60 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            </div>

            <div className="flex-1 lg:flex-none" />

            {/* Branch selector */}
            <div className="hidden sm:block">
              <BranchSelector />
            </div>

            {/* Notifications */}
            <Button ref={bellRef} variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 border-l border-border hover:bg-accent/30 rounded-md px-2 py-1 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{initials}</span>
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{user?.email?.split("@")[0]}</span>
                    <span className="text-[10px] text-muted-foreground">{brandName || "Admin"}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">{brandName || "Administrador"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2" onClick={() => setShowChangePassword(true)}>
                  <KeyRound className="h-3.5 w-3.5" /> Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => signOut()}>
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto shrink-0 md:hidden">
              <ContextBadge mode="admin" brandName={brandName || undefined} impersonating={isImpersonating} />
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto scrollbar-thin">
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
          <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
        </div>
      </div>
    </SidebarProvider>
  );
}
