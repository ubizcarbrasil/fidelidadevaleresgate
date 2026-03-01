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
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground">Vale Resgate — {CONSOLE_TITLES[consoleScope]}</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
          <ContextualHelpDrawer />
        </div>
      </div>
    </SidebarProvider>
  );
}
