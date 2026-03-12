import {
  ShoppingBag, Tag, UserCheck, ReceiptText, LayoutDashboard, LogOut, Ticket,
  FileSpreadsheet, Coins, ScrollText, Settings2, ClipboardCheck, Store,
  ClipboardList, ScanLine, Sparkles, PackageSearch, BarChart3, Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandModules } from "@/hooks/useBrandModules";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  moduleKey?: string;
}

const groups: { label: string; items: MenuItem[] }[] = [
  {
    label: "📊 Visão Geral",
    items: [
      { title: "Painel Principal", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "🏪 Operações",
    items: [
      { title: "Parceiros", url: "/stores", icon: ShoppingBag, moduleKey: "stores" },
      { title: "Ofertas", url: "/offers", icon: Tag, moduleKey: "offers" },
      { title: "Clientes", url: "/customers", icon: UserCheck, moduleKey: "wallet" },
      { title: "Resgates", url: "/redemptions", icon: ReceiptText, moduleKey: "redemption_qr" },
      { title: "Cupons", url: "/vouchers", icon: Ticket, moduleKey: "vouchers" },
      { title: "Aprovação de Parceiros", url: "/store-approvals", icon: Store, moduleKey: "stores" },
      { title: "Aprovar Regras", url: "/approve-store-rules", icon: ClipboardCheck, moduleKey: "earn_points_store" },
      { title: "Importar Planilha", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "stores" },
      { title: "Achadinhos", url: "/affiliate-deals", icon: Sparkles },
      { title: "Categorias Achadinhos", url: "/affiliate-categories", icon: Sparkles },
      { title: "Catálogo", url: "/store-catalog", icon: PackageSearch, moduleKey: "stores" },
      { title: "Enviar Notificação", url: "/send-notification", icon: Bell },
      { title: "Operador PDV", url: "/pdv", icon: ScanLine },
    ],
  },
  {
    label: "💰 Programa de Pontos",
    items: [
      { title: "Pontuar", url: "/earn-points", icon: Coins, moduleKey: "earn_points_store" },
      { title: "Regras de Pontos", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store" },
      { title: "Minha Regra de Pontos", url: "/store-points-rule", icon: Store, moduleKey: "earn_points_store" },
      { title: "Extrato de Pontos", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store" },
    ],
  },
  {
    label: "📈 Análises",
    items: [
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
      { title: "Auditoria", url: "/audit", icon: ClipboardList },
    ],
  },
];

export function BranchSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isModuleEnabled } = useBrandModules();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Ticket className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Vale Resgate</span>
              <span className="text-xs text-sidebar-foreground/60">Administrador da Cidade</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.moduleKey || isModuleEnabled(item.moduleKey)
          );
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === item.url ||
                          (item.url !== "/" && location.pathname.startsWith(item.url))
                        }
                        tooltip={item.title}
                      >
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="hover:bg-sidebar-accent/50"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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