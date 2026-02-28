import {
  Building2, Store, MapPin, Users, LayoutDashboard, LogOut, Ticket, Globe,
  ShoppingBag, Tag, UserCheck, ReceiptText, Blocks, Layout, Flag, ScrollText, Rocket, LayoutTemplate, FileSpreadsheet, Copy,
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

const coreItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tenants", url: "/tenants", icon: Building2 },
  { title: "Brands", url: "/brands", icon: Store },
  { title: "Branches", url: "/branches", icon: MapPin },
  { title: "Clonar Branch", url: "/clone-branch", icon: Copy },
  { title: "Domínios", url: "/domains", icon: Globe },
];

const operationItems = [
  { title: "Lojas", url: "/stores", icon: ShoppingBag },
  { title: "Ofertas", url: "/offers", icon: Tag },
  { title: "Clientes", url: "/customers", icon: UserCheck },
  { title: "Resgates", url: "/redemptions", icon: ReceiptText },
  { title: "Vouchers", url: "/vouchers", icon: Ticket },
  { title: "Importar CSV", url: "/csv-import", icon: FileSpreadsheet },
];

const platformItems = [
  { title: "Módulos", url: "/modules", icon: Blocks },
  { title: "Templates", url: "/templates", icon: Layout },
  { title: "Templates Home", url: "/home-templates", icon: LayoutTemplate },
  { title: "Feature Flags", url: "/flags", icon: Flag },
  { title: "Releases", url: "/releases", icon: Rocket },
  { title: "Auditoria", url: "/audit", icon: ScrollText },
  { title: "Usuários", url: "/users", icon: Users },
];

export function RootSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  const renderGroup = (label: string, items: typeof coreItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))}>
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
  );

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
              <span className="text-xs text-sidebar-foreground/60">Root Console</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Gestão", coreItems)}
        {renderGroup("Operação", operationItems)}
        {renderGroup("Plataforma", platformItems)}
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
