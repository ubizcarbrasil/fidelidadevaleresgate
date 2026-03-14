import {
  Building2, Store, MapPin, Users, LayoutDashboard, LogOut, Ticket, Globe,
  ShoppingBag, Tag, UserCheck, ReceiptText, Blocks, Layout, Flag, ScrollText, Rocket, LayoutList, FileSpreadsheet, Copy, Shield, Coins, Settings2, ShieldCheck, Sparkles, PackageSearch, BarChart3, Bell, Image, Type, FolderTree, Layers, ScanLine, Zap, Handshake, Eye,
  TrendingUp, FlaskConical, ChevronRight, FileText, Key, BookOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import PlatformLogo from "@/components/PlatformLogo";

interface MenuItem {
  key: string;
  defaultTitle: string;
  url: string;
  icon: any;
}

const dashboardItem: MenuItem = {
  key: "sidebar.dashboard", defaultTitle: "Painel Principal", url: "/", icon: LayoutDashboard,
};

const groups: { label: string; items: MenuItem[] }[] = [
  {
    label: "Jornadas",
    items: [
      { key: "sidebar.jornada_root", defaultTitle: "Jornada Completa", url: "/root-journey", icon: Rocket },
      { key: "sidebar.jornada", defaultTitle: "Jornada do Empreendedor", url: "/brand-journey", icon: Store },
      { key: "sidebar.jornada_emissor", defaultTitle: "Jornada do Emissor", url: "/emitter-journey", icon: Zap },
    ],
  },
  {
    label: "Estrutura",
    items: [
      { key: "sidebar.empresas", defaultTitle: "Empresas", url: "/tenants", icon: Building2 },
      { key: "sidebar.marcas", defaultTitle: "Marcas", url: "/brands", icon: Store },
      { key: "sidebar.branches", defaultTitle: "Cidades", url: "/branches", icon: MapPin },
      { key: "sidebar.clonar_cidade", defaultTitle: "Clonar Cidade", url: "/clone-branch", icon: Copy },
      { key: "sidebar.dominios", defaultTitle: "Domínios", url: "/domains", icon: Globe },
      { key: "sidebar.provisionar_marca", defaultTitle: "Provisionar Marca", url: "/provision-brand", icon: Rocket },
      { key: "sidebar.central_acessos", defaultTitle: "Central de Acessos", url: "/access-hub", icon: Eye },
    ],
  },
  {
    label: "Identidade & Vitrine",
    items: [
      { key: "sidebar.galeria_icones", defaultTitle: "Galeria de Ícones", url: "/icon-library", icon: Image },
      { key: "sidebar.central_banners", defaultTitle: "Central de Propagandas", url: "/banner-manager", icon: Image },
      { key: "sidebar.nomes_rotulos", defaultTitle: "Nomes e Rótulos", url: "/menu-labels", icon: Type },
      { key: "sidebar.page_builder", defaultTitle: "Construtor de Páginas", url: "/page-builder", icon: Layers },
      { key: "sidebar.tema_plataforma", defaultTitle: "Tema da Plataforma", url: "/platform-theme", icon: Settings2 },
      { key: "sidebar.welcome_tour", defaultTitle: "Tour de Boas-Vindas", url: "/welcome-tour", icon: Rocket },
      { key: "sidebar.profile_links", defaultTitle: "Links do Perfil", url: "/profile-links", icon: FileText },
    ],
  },
  {
    label: "Validação",
    items: [
      { key: "sidebar.aprovacao_lojas", defaultTitle: "Aprovação de Parceiros", url: "/store-approvals", icon: ShieldCheck },
      { key: "sidebar.aprovar_regras", defaultTitle: "Aprovar Regras", url: "/approve-store-rules", icon: Shield },
      { key: "sidebar.solicitacoes_emissor", defaultTitle: "Solicitações de Emissor", url: "/emitter-requests", icon: Zap },
      { key: "sidebar.catalogo", defaultTitle: "Catálogo", url: "/store-catalog", icon: PackageSearch },
    ],
  },
  {
    label: "Operação",
    items: [
      { key: "sidebar.parceiros", defaultTitle: "Parceiros", url: "/stores", icon: ShoppingBag },
      { key: "sidebar.ofertas", defaultTitle: "Ofertas", url: "/offers", icon: Tag },
      { key: "sidebar.clientes", defaultTitle: "Clientes", url: "/customers", icon: UserCheck },
      { key: "sidebar.resgates", defaultTitle: "Resgates", url: "/redemptions", icon: ReceiptText },
      { key: "sidebar.cupons", defaultTitle: "Cupons", url: "/vouchers", icon: Ticket },
      { key: "sidebar.importar_csv", defaultTitle: "Importar Planilha", url: "/csv-import", icon: FileSpreadsheet },
      { key: "sidebar.achadinhos", defaultTitle: "Achadinhos", url: "/affiliate-deals", icon: Sparkles },
      { key: "sidebar.categorias_achadinhos", defaultTitle: "Categorias Achadinhos", url: "/affiliate-categories", icon: Sparkles },
      { key: "sidebar.enviar_notificacao", defaultTitle: "Enviar Notificação", url: "/send-notification", icon: Bell },
      { key: "sidebar.operador_pdv", defaultTitle: "Operador PDV", url: "/pdv", icon: ScanLine },
      { key: "sidebar.patrocinados", defaultTitle: "Patrocinados", url: "/sponsored-placements", icon: Zap },
    ],
  },
  {
    label: "Pontos",
    items: [
      { key: "sidebar.pontuar", defaultTitle: "Pontuar", url: "/earn-points", icon: Coins },
      { key: "sidebar.regras_pontos", defaultTitle: "Regras de Pontos", url: "/points-rules", icon: Settings2 },
      { key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Pontos", url: "/points-ledger", icon: ScrollText },
    ],
  },
  {
    label: "Ganha-Ganha",
    items: [
      { key: "sidebar.gg_dashboard", defaultTitle: "Dashboard Consolidado", url: "/ganha-ganha-dashboard", icon: Handshake },
      { key: "sidebar.gg_config", defaultTitle: "Configuração GG", url: "/ganha-ganha-config", icon: Settings2 },
      { key: "sidebar.gg_billing", defaultTitle: "Painel Financeiro GG", url: "/ganha-ganha-billing", icon: ReceiptText },
      { key: "sidebar.gg_closing", defaultTitle: "Fechamento Mensal", url: "/ganha-ganha-closing", icon: ScrollText },
    ],
  },
  {
    label: "Usuários e Permissões",
    items: [
      { key: "sidebar.usuarios", defaultTitle: "Usuários", url: "/users", icon: Users },
      { key: "sidebar.modulos", defaultTitle: "Módulos da Marca", url: "/brand-modules", icon: Blocks },
      { key: "sidebar.perm_parceiros", defaultTitle: "Permissões por Empresa", url: "/brand-permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "CRM Estratégico",
    items: [
      { key: "sidebar.crm", defaultTitle: "CRM Estratégico", url: "/crm", icon: TrendingUp },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { key: "sidebar.funcionalidades", defaultTitle: "Funcionalidades", url: "/modules", icon: Blocks },
      { key: "sidebar.permissoes_globais", defaultTitle: "Permissões Globais", url: "/permissions", icon: Shield },
      { key: "sidebar.secoes_home", defaultTitle: "Seções da Home", url: "/templates", icon: Layout },
      { key: "sidebar.modelos_home", defaultTitle: "Modelos de Home", url: "/home-templates", icon: LayoutList },
      { key: "sidebar.controle_recursos", defaultTitle: "Controle de Recursos", url: "/flags", icon: Flag },
      { key: "sidebar.atualizacoes", defaultTitle: "Atualizações", url: "/releases", icon: Rocket },
      { key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ScrollText },
      { key: "sidebar.relatorios", defaultTitle: "Relatórios", url: "/reports", icon: BarChart3 },
      { key: "sidebar.taxonomia", defaultTitle: "Taxonomia", url: "/taxonomy", icon: FolderTree },
      { key: "sidebar.kit_inicial", defaultTitle: "Kit Inicial", url: "/starter-kit", icon: PackageSearch },
      { key: "sidebar.teste_webhook", defaultTitle: "Teste Webhook", url: "/machine-webhook-test", icon: FlaskConical },
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

export function RootSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { getLabel } = useMenuLabels("admin");
  const badges = useSidebarBadges();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <PlatformLogo className="h-8 w-8 rounded-lg" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Vale Resgate</span>
              <span className="text-xs text-sidebar-foreground/60">Painel Raiz</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard fixo no topo */}
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

        {/* Grupos colapsáveis */}
        {groups.map((group) => (
          <CollapsibleGroup
            key={group.label}
            label={group.label}
            items={group.items}
            collapsed={collapsed}
            location={location}
            getLabel={getLabel}
            badges={badges}
          />
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
