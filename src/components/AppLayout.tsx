import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { RootSidebar } from "@/components/consoles/RootSidebar";
import { TenantSidebar } from "@/components/consoles/TenantSidebar";
import { BrandSidebar } from "@/components/consoles/BrandSidebar";
import { BranchSidebar } from "@/components/consoles/BranchSidebar";
import { OperatorSidebar } from "@/components/consoles/OperatorSidebar";
import { ContextualHelpDrawer } from "@/components/ContextualHelpDrawer";

const CONSOLE_TITLES: Record<string, string> = {
  ROOT: "Root Console",
  TENANT: "Tenant Console",
  BRAND: "Brand Console",
  BRANCH: "Branch Console",
  OPERATOR: "Operador PDV",
  STORE_ADMIN: "Painel do Lojista",
};

export default function AppLayout() {
  const { consoleScope } = useBrandGuard();

  // Store admins should use the dedicated store panel
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
            <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">Vale Resgate — {CONSOLE_TITLES[consoleScope]}</h1>
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto">
            <Outlet />
          </main>
          <ContextualHelpDrawer />
        </div>
      </div>
    </SidebarProvider>
  );
}
