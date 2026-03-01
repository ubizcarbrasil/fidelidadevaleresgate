import {
  Store, MapPin, LayoutDashboard, LogOut, Globe, Palette, Layout, Users,
  FileSpreadsheet, Blocks, Settings2, ScrollText, ShieldCheck, Image, Tag, Type,
  FileText, ClipboardList, Layers,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandModules } from "@/hooks/useBrandModules";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface MenuItem {
  key: string;
  defaultTitle: string;
  url: string;
  icon: any;
  moduleKey?: string;
}

const groups: { label: string; items: MenuItem[] }[] = [
  {
    label: "📊 Visão Geral",
    items: [
      { key: "sidebar.dashboard", defaultTitle: "Painel Principal", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "🎨 Identidade Visual",
    items: [
      { key: "sidebar.tema_marca", defaultTitle: "Aparência da Marca", url: "/brands", icon: Palette },
      { key: "sidebar.dominios", defaultTitle: "Domínios", url: "/domains", icon: Globe },
      { key: "sidebar.galeria_icones", defaultTitle: "Galeria de Ícones", url: "/icon-library", icon: Image },
    ],
  },
  {
    label: "📱 Vitrine do App",
    items: [
      { key: "sidebar.secoes_home", defaultTitle: "Seções da Tela Inicial", url: "/templates", icon: Layout, moduleKey: "home_sections" },
      { key: "sidebar.central_banners", defaultTitle: "Central de Propagandas", url: "/banner-manager", icon: Image },
      { key: "sidebar.nomes_rotulos", defaultTitle: "Nomes e Rótulos", url: "/menu-labels", icon: Type },
      { key: "sidebar.page_builder", defaultTitle: "Montador de Páginas", url: "/page-builder", icon: FileText },
      { key: "sidebar.page_builder_v2", defaultTitle: "Construtor de Páginas V2", url: "/page-builder-v2", icon: Layers },
    ],
  },
  {
    label: "🏪 Operações",
    items: [
      { key: "sidebar.branches", defaultTitle: "Cidades", url: "/branches", icon: MapPin },
      { key: "sidebar.aprovacao_lojas", defaultTitle: "Aprovação de Parceiros", url: "/store-approvals", icon: ShieldCheck, moduleKey: "stores" },
      { key: "sidebar.importar_csv", defaultTitle: "Importar Planilha", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "stores" },
    ],
  },
  {
    label: "💰 Programa de Pontos",
    items: [
      { key: "sidebar.regras_pontos", defaultTitle: "Regras de Pontos", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store" },
      { key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Pontos", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store" },
    ],
  },
  {
    label: "👥 Usuários & Permissões",
    items: [
      { key: "sidebar.usuarios", defaultTitle: "Usuários", url: "/users", icon: Users },
      { key: "sidebar.modulos", defaultTitle: "Funcionalidades", url: "/brand-modules", icon: Blocks },
      { key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ClipboardList },
    ],
  },
];

export function BrandSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isModuleEnabled } = useBrandModules();
  const { getLabel } = useMenuLabels("admin");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Store className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Vale Resgate</span>
              <span className="text-xs text-sidebar-foreground/60">Painel do Empreendedor</span>
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
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === item.url ||
                          (item.url !== "/" && location.pathname.startsWith(item.url))
                        }
                      >
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="hover:bg-sidebar-accent/50"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{getLabel(item.key)}</span>}
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
        {!collapsed && (
          <div className="mb-2 truncate text-xs text-sidebar-foreground/60">{user?.email}</div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
