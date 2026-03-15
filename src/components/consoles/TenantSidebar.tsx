import {
  Building2, Store, MapPin, LayoutDashboard, LogOut, Ticket, Users, Globe,
  ShoppingBag, Tag, UserCheck, ReceiptText, BarChart3, ClipboardList,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const groups = [
  {
    label: "Visão Geral",
    items: [
      { title: "Visão Geral", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Organização",
    items: [
      { title: "Marcas", url: "/brands", icon: Store },
      { title: "Cidades", url: "/branches", icon: MapPin },
      { title: "Domínios", url: "/domains", icon: Globe },
    ],
  },
  {
    label: "Gestão Comercial",
    items: [
      { title: "Parceiros", url: "/stores", icon: ShoppingBag },
      { title: "Ofertas", url: "/offers", icon: Tag },
      { title: "Clientes", url: "/customers", icon: UserCheck },
      { title: "Resgates", url: "/redemptions", icon: ReceiptText },
      { title: "Cupons", url: "/vouchers", icon: Ticket },
    ],
  },
  {
    label: "Equipe",
    items: [
      { title: "Usuários", url: "/users", icon: Users },
    ],
  },
  {
    label: "Inteligência & Dados",
    items: [
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
      { title: "Auditoria", url: "/audit", icon: ClipboardList },
    ],
  },
];

export function TenantSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Vale Resgate</span>
              <span className="text-xs text-sidebar-foreground/60">Gestão Corporativa</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))} tooltip={item.title}>
                      <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
