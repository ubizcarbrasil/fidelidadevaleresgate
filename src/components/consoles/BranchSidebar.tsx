import { ShoppingBag, Tag, UserCheck, ReceiptText, LayoutDashboard, LogOut, Ticket, FileSpreadsheet, Coins, ScrollText, Settings2, ClipboardCheck, ClipboardList, ScanLine, PackageSearch, BarChart3, Bell, ChevronRight, BookOpen, ShoppingCart, FolderHeart, Swords } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandModules } from "@/hooks/useBrandModules";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { useBranchScoringModel } from "@/hooks/useBranchScoringModel";
import { useBranchModules } from "@/hooks/useBranchModules";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import PlatformLogo from "@/components/PlatformLogo";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBranchCityName } from "@/hooks/hook_branch_city";

interface MenuItem {
  key: string;
  defaultTitle: string;
  url: string;
  icon: any;
  moduleKey?: string;
  scoringFilter?: "DRIVER" | "PASSENGER";
}

type BranchModuleKey = "enable_duels_module" | "enable_achadinhos_module" | "enable_marketplace_module" | "enable_race_earn_module" | "enable_customer_scoring_module";

const dashboardItem: MenuItem = {
  key: "sidebar.dashboard", defaultTitle: "Visão Geral", url: "/", icon: LayoutDashboard,
};

const groups: { label: string; scoringFilter?: "DRIVER" | "PASSENGER"; branchModuleKey?: BranchModuleKey; items: MenuItem[] }[] = [
  {
    label: "Gestão Comercial",
    scoringFilter: "PASSENGER",
    items: [
      { key: "sidebar.operador_pdv", defaultTitle: "Caixa PDV", url: "/pdv", icon: ScanLine, moduleKey: "earn_points_store" },
      { key: "sidebar.parceiros", defaultTitle: "Parceiros", url: "/stores", icon: ShoppingBag, moduleKey: "stores" },
      { key: "sidebar.ofertas", defaultTitle: "Ofertas", url: "/offers", icon: Tag, moduleKey: "offers" },
      { key: "sidebar.clientes", defaultTitle: "Clientes", url: "/customers", icon: UserCheck, moduleKey: "wallet" },
      { key: "sidebar.resgates", defaultTitle: "Resgates", url: "/redemptions", icon: ReceiptText, moduleKey: "redemption_qr" },
      { key: "sidebar.cupons", defaultTitle: "Cupons", url: "/vouchers", icon: Ticket, moduleKey: "vouchers" },
    ],
  },
  {
    label: "Aprovações",
    scoringFilter: "PASSENGER",
    items: [
      { key: "sidebar.aprovar_regras", defaultTitle: "Validar Regras", url: "/approve-store-rules", icon: ClipboardCheck, moduleKey: "earn_points_store" },
      { key: "sidebar.catalogo", defaultTitle: "Catálogo", url: "/store-catalog", icon: PackageSearch, moduleKey: "catalog" },
    ],
  },
  {
    label: "Achadinhos",
    scoringFilter: "PASSENGER",
    items: [
      { key: "sidebar.achadinhos", defaultTitle: "Achadinhos", url: "/affiliate-deals", icon: ShoppingCart, moduleKey: "affiliate_deals" },
      { key: "sidebar.categorias_achadinhos", defaultTitle: "Categorias de Achadinhos", url: "/affiliate-categories", icon: FolderHeart, moduleKey: "affiliate_deals" },
    ],
  },
  {
    label: "Comunicação",
    scoringFilter: "PASSENGER",
    items: [
      { key: "sidebar.enviar_notificacao", defaultTitle: "Enviar Notificação", url: "/send-notification", icon: Bell, moduleKey: "notifications" },
    ],
  },
  {
    label: "Motoristas & Resgate",
    scoringFilter: "DRIVER",
    items: [
      { key: "sidebar.carteira_pontos", defaultTitle: "Carteira de Pontos", url: "/branch-wallet", icon: Coins, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.comprar_pontos", defaultTitle: "Comprar Pontos", url: "/points-packages-store", icon: ShoppingCart, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.regras_motorista", defaultTitle: "Regras de Pontuação", url: "/driver-points-rules", icon: Settings2, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.produtos_resgate", defaultTitle: "Produtos de Resgate", url: "/produtos-resgate", icon: ShoppingBag, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.pedidos_resgate", defaultTitle: "Pedidos de Resgate", url: "/product-redemption-orders", icon: ReceiptText, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.motoristas", defaultTitle: "Motoristas", url: "/motoristas", icon: UserCheck, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.relatorios_cidade", defaultTitle: "Relatórios", url: "/branch-reports", icon: BarChart3, moduleKey: "achadinhos_motorista" },
      { key: "sidebar.manuais", defaultTitle: "Manuais", url: "/manuais", icon: BookOpen, moduleKey: "achadinhos_motorista" },
    ],
  },
  {
    label: "Programa de Fidelidade",
    scoringFilter: "PASSENGER",
    items: [
      { key: "sidebar.pontuar", defaultTitle: "Pontuar", url: "/earn-points", icon: Coins, moduleKey: "earn_points_store" },
      { key: "sidebar.regras_pontos", defaultTitle: "Regras de Fidelidade", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store" },
      { key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Fidelidade", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store" },
    ],
  },
  {
    label: "Gamificação",
    scoringFilter: "DRIVER",
    items: [
      { key: "sidebar.gamificacao", defaultTitle: "Duelos & Ranking", url: "/gamificacao-admin", icon: Swords, moduleKey: "achadinhos_motorista" },
    ],
  },
  {
    label: "Inteligência & Dados",
    items: [
      { key: "sidebar.relatorios", defaultTitle: "Relatórios", url: "/reports", icon: BarChart3, moduleKey: "reports" },
      { key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ClipboardList, moduleKey: "audit" },
      { key: "sidebar.importar_csv", defaultTitle: "Importação de Dados", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "stores" },
    ],
  },
];

function CollapsibleGroup({
  label,
  items,
  collapsed,
  location,
  getLabel,
  badges,
}: {
  label: string;
  items: MenuItem[];
  collapsed: boolean;
  location: { pathname: string };
  getLabel: (key: string) => string;
  badges: Record<string, number>;
}) {
  const hasActiveRoute = items.some(
    (item) =>
      location.pathname === item.url ||
      (item.url !== "/" && location.pathname.startsWith(item.url))
  );

  return (
    <Collapsible defaultOpen={hasActiveRoute} className="group/collapsible">
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          {!collapsed && <span>{label}</span>}
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const badgeCount = badges[item.key];
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === item.url ||
                        (item.url !== "/" && location.pathname.startsWith(item.url))
                      }
                      tooltip={getLabel(item.key)}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">{getLabel(item.key)}</span>}
                        {badgeCount && badgeCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-[10px] font-bold">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function BranchSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isModuleEnabled } = useBrandModules();
  const { getLabel } = useMenuLabels("admin");
  const badges = useSidebarBadges();
  const { isDriverEnabled, isPassengerEnabled } = useBranchScoringModel();
  const { name: brandName, logoUrl } = useBrandInfo();
  const cityName = useBranchCityName();

  const visibleGroups = groups
    .filter((group) => {
      if (group.scoringFilter === "DRIVER" && !isDriverEnabled) return false;
      if (group.scoringFilter === "PASSENGER" && !isPassengerEnabled) return false;
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.moduleKey || isModuleEnabled(item.moduleKey)
      ),
    }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <PlatformLogo src={logoUrl} alt={brandName || "Logo"} className="h-8 w-8 rounded-lg" fallbackLabel={(brandName || "VR").substring(0, 2).toUpperCase()} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">{brandName || "Marca"}</span>
              <span className="text-xs text-sidebar-foreground/60">{cityName || "Gestão Regional"}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/"}
                  tooltip={getLabel(dashboardItem.key)}
                >
                  <NavLink
                    to="/"
                    end
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span className="flex-1">{getLabel(dashboardItem.key)}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleGroups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <CollapsibleGroup
              key={group.label}
              label={group.label}
              items={group.items}
              collapsed={collapsed}
              location={location}
              getLabel={getLabel}
              badges={badges}
            />
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && <div className="mb-2 truncate text-xs text-sidebar-foreground/60">{user?.email}</div>}
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4 mr-2" />{!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}