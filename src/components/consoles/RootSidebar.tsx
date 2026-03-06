import {
  Building2, Store, MapPin, Users, LayoutDashboard, LogOut, Ticket, Globe,
  ShoppingBag, Tag, UserCheck, ReceiptText, Blocks, Layout, Flag, ScrollText, Rocket, LayoutList, FileSpreadsheet, Copy, Shield, Coins, Settings2, ShieldCheck, Sparkles, PackageSearch, BarChart3, Bell, Image, Type, FolderTree, Layers, ScanLine, Zap,
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
    label: "📊 Visão Geral",
    items: [
      { title: "Painel Principal", url: "/", icon: LayoutDashboard },
      { title: "Jornada Completa", url: "/root-journey", icon: Rocket },
      { title: "Jornada do Empreendedor", url: "/brand-journey", icon: Store },
      { title: "Jornada do Emissor", url: "/emitter-journey", icon: Zap },
    ],
  },
  {
    label: "🏢 Estrutura",
    items: [
      { title: "Empresas", url: "/tenants", icon: Building2 },
      { title: "Marcas", url: "/brands", icon: Store },
      { title: "Cidades", url: "/branches", icon: MapPin },
      { title: "Clonar Cidade", url: "/clone-branch", icon: Copy },
      { title: "Domínios", url: "/domains", icon: Globe },
      { title: "Nova Empresa", url: "/provision-brand", icon: Rocket },
    ],
  },
  {
    label: "🎨 Identidade & Vitrine",
    items: [
      { title: "Galeria de Ícones", url: "/icon-library", icon: Image },
      { title: "Central de Propagandas", url: "/banner-manager", icon: Image },
      { title: "Nomes e Rótulos", url: "/menu-labels", icon: Type },
      { title: "Construtor de Páginas", url: "/page-builder", icon: Layers },
      { title: "Tema da Plataforma", url: "/platform-theme", icon: Settings2 },
      
    ],
  },
  {
    label: "🏪 Operações",
    items: [
      { title: "Parceiros", url: "/stores", icon: ShoppingBag },
      { title: "Ofertas", url: "/offers", icon: Tag },
      { title: "Clientes", url: "/customers", icon: UserCheck },
      { title: "Resgates", url: "/redemptions", icon: ReceiptText },
      { title: "Cupons", url: "/vouchers", icon: Ticket },
      { title: "Importar Planilha", url: "/csv-import", icon: FileSpreadsheet },
      { title: "Aprovação de Parceiros", url: "/store-approvals", icon: ShieldCheck },
      { title: "Aprovar Regras", url: "/approve-store-rules", icon: Shield },
      { title: "Solicitações de Emissor", url: "/emitter-requests", icon: Zap },
      { title: "Achadinhos", url: "/affiliate-deals", icon: Sparkles },
      { title: "Catálogo", url: "/store-catalog", icon: PackageSearch },
      { title: "Enviar Notificação", url: "/send-notification", icon: Bell },
      { title: "Operador PDV", url: "/pdv", icon: ScanLine },
    ],
  },
  {
    label: "💰 Programa de Pontos",
    items: [
      { title: "Pontuar", url: "/earn-points", icon: Coins },
      { title: "Regras de Pontos", url: "/points-rules", icon: Settings2 },
      { title: "Regra de Pontos do Parceiro", url: "/store-points-rule", icon: Coins },
      { title: "Extrato de Pontos", url: "/points-ledger", icon: ScrollText },
    ],
  },
  {
    label: "👥 Usuários & Permissões",
    items: [
      { title: "Usuários", url: "/users", icon: Users },
      { title: "Módulos da Marca", url: "/brand-modules", icon: Blocks },
      { title: "Permissões por Empresa", url: "/brand-permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "⚙️ Plataforma",
    items: [
      { title: "Funcionalidades", url: "/modules", icon: Blocks },
      { title: "Permissões", url: "/permissions", icon: Shield },
      { title: "Seções da Home", url: "/templates", icon: Layout },
      { title: "Modelos de Home", url: "/home-templates", icon: LayoutList },
      { title: "Controle de Recursos", url: "/flags", icon: Flag },
      { title: "Atualizações", url: "/releases", icon: Rocket },
      { title: "Auditoria", url: "/audit", icon: ScrollText },
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
      { title: "Taxonomia", url: "/taxonomy", icon: FolderTree },
      { title: "Kit Inicial", url: "/starter-kit", icon: PackageSearch },
    ],
  },
];

export function RootSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

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
              <span className="text-xs text-sidebar-foreground/60">Painel Raiz</span>
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
