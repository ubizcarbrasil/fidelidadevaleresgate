import { Outlet, Navigate, useLocation } from "react-router-dom";
import TrialBanner from "@/components/TrialBanner";
import TrialExpiredBlocker from "@/components/TrialExpiredBlocker";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Bell, ChevronDown, ChevronRight, LogOut, KeyRound, Globe } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { ContextBadge } from "@/components/ContextBadge";
import BranchSelector from "@/components/BranchSelector";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { ScopeSwitcher } from "@/components/ScopeSwitcher";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Lazy-load heavy sidebar components
const RootSidebar = lazyWithRetry(() => import("@/components/consoles/RootSidebar").then(m => ({ default: m.RootSidebar })));
const TenantSidebar = lazyWithRetry(() => import("@/components/consoles/TenantSidebar").then(m => ({ default: m.TenantSidebar })));
const BrandSidebar = lazyWithRetry(() => import("@/components/consoles/BrandSidebar").then(m => ({ default: m.BrandSidebar })));
const BranchSidebar = lazyWithRetry(() => import("@/components/consoles/BranchSidebar").then(m => ({ default: m.BranchSidebar })));
const OperatorSidebar = lazyWithRetry(() => import("@/components/consoles/OperatorSidebar").then(m => ({ default: m.OperatorSidebar })));
const ContextualHelpDrawer = lazyWithRetry(() => import("@/components/ContextualHelpDrawer").then(m => ({ default: m.ContextualHelpDrawer })));
const CommandPalette = lazyWithRetry(() => import("@/components/CommandPalette").then(m => ({ default: m.CommandPalette })));
const ApiKeyOnboardingDialog = lazyWithRetry(() => import("@/components/ApiKeyOnboardingDialog").then(m => ({ default: m.ApiKeyOnboardingDialog })));

const routeLabels: Record<string, string> = {
  "/": "Visão Geral",
  "/branches": "Cidades",
  "/brand-branches": "Cidades",
  "/brand-branches/new": "Nova Cidade",
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Visão Geral", href: "/" }];
  const crumbs = [{ label: "Início", href: "/" }];
  let accumulated = "";
  for (const seg of segments) {
    accumulated += `/${seg}`;
    let label: string;
    if (routeLabels[accumulated]) {
      label = routeLabels[accumulated];
    } else if (UUID_REGEX.test(seg)) {
      label = "Editar";
    } else if (seg.toLowerCase() === "new") {
      label = "Novo";
    } else {
      label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    }
    crumbs.push({ label, href: accumulated });
  }
  return crumbs;
}

export default function AppLayout() {
  const { consoleScope, isRootAdmin } = useBrandGuard();
  const { isWhiteLabel } = useBrand();
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

  // Boot Supabase fetches em paralelo (platform_theme + brand_settings quando aplicável)
  useEffect(() => {
    let cancelled = false;
    const platformPromise = supabase
      .from("platform_config")
      .select("value_json")
      .eq("key", "platform_theme")
      .maybeSingle();

    const brandPromise = (consoleScope === "BRAND" && brandId)
      ? supabase.from("brands").select("brand_settings_json").eq("id", brandId).single()
      : Promise.resolve({ data: null });

    Promise.all([platformPromise, brandPromise]).then(([platformRes, brandRes]) => {
      if (cancelled) return;
      if (platformRes.data?.value_json) setPlatformTheme(platformRes.data.value_json);
      const settings = (brandRes as any)?.data?.brand_settings_json as Record<string, any> | null;
      if (settings && !settings.api_key_onboarding_seen) {
        setShowApiKeyOnboarding(true);
      }
    });

    // Bell-ring adiado para idle — não compete com boot inicial
    const ric = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000));
    const cancelRic = (window as any).cancelIdleCallback ?? clearTimeout;
    const idleId = ric(() => {
      bellRef.current?.classList.add("bell-ring");
      setTimeout(() => bellRef.current?.classList.remove("bell-ring"), 900);
    });

    return () => {
      cancelled = true;
      try { cancelRic(idleId); } catch { /* noop */ }
    };
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
        <Suspense fallback={<div className="w-16 shrink-0 bg-sidebar" />}>
          <SidebarComponent />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-2 sm:gap-3 px-2 sm:px-4 saas-topbar shrink-0 relative z-10 pwa-safe-top pwa-safe-x">
            <SidebarTrigger className="mr-1 shrink-0" />

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

            {isWhiteLabel && !isImpersonating && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-md shrink-0">
                <Globe className="h-3.5 w-3.5" />
                <span>Domínio próprio</span>
              </div>
            )}

            <div className="hidden sm:block">
              <ScopeSwitcher />
            </div>

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

            <button
              type="button"
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="hidden lg:flex items-center gap-2 ml-auto w-64 h-8 px-3 text-xs text-muted-foreground bg-accent/50 border border-border/50 rounded-md hover:bg-accent transition-colors"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Buscar…</span>
              <kbd className="text-[10px] text-muted-foreground/60 border border-border/60 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Título da rota só no mobile */}
            <div className="md:hidden flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground truncate block">
                {crumbs[crumbs.length - 1]?.label}
              </span>
            </div>

            <div className="flex-1 lg:flex-none hidden md:block" />

            <div className="hidden sm:block">
              <BranchSelector />
            </div>

            <Button ref={bellRef} variant="ghost" size="icon" className="relative h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground no-touch-min">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 border-l border-border hover:bg-accent/30 rounded-md px-2 py-1 transition-colors shrink-0 no-touch-min">
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
                <ChangePasswordDialog trigger={
                  <DropdownMenuItem className="text-xs gap-2" onSelect={(e) => e.preventDefault()}>
                    <KeyRound className="h-3.5 w-3.5" /> Alterar Senha
                  </DropdownMenuItem>
                } />
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => signOut()}>
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-3 sm:p-6 overflow-auto scrollbar-thin pwa-safe-bottom pwa-safe-x">
            <TrialBanner />
            <Outlet />
          </main>
          <TrialExpiredBlocker />
          <Suspense fallback={null}>
            <ContextualHelpDrawer />
          </Suspense>
          {showApiKeyOnboarding && brandId && (
            <Suspense fallback={null}>
              <ApiKeyOnboardingDialog
                open={showApiKeyOnboarding}
                onDismiss={() => setShowApiKeyOnboarding(false)}
                brandId={brandId}
              />
            </Suspense>
          )}
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}
