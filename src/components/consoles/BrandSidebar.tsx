import {
  Store, MapPin, LayoutDashboard, LogOut, Globe, Palette, Layout, Users,
  FileSpreadsheet, Blocks, Settings2, ScrollText, ShieldCheck, Image, Tag, Type,
  FileText, ClipboardList, Layers, ShoppingBag, UserCheck, ReceiptText, Ticket,
  Coins, Sparkles, PackageSearch, BarChart3, Bell, ScanLine, Shield, FolderTree, Zap, Rocket, Key, BookOpen, Eye, TrendingUp, Target, Crown, UserX, Users2,
  Contact, Layers3, Megaphone, PieChart, FileUp, ChevronRight, Car, FlaskConical, LayoutTemplate,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandModules } from "@/hooks/useBrandModules";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface MenuItem {
  key: string;
  defaultTitle: string;
  url: string;
  icon: any;
  moduleKey?: string;
}

const dashboardItem: MenuItem = {
  key: "sidebar.dashboard", defaultTitle: "Visão Geral", url: "/", icon: LayoutDashboard,
};

const groups: { label: string; items: MenuItem[] }[] = [
  {
    label: "Personalização",
    items: [
      { key: "sidebar.branches", defaultTitle: "Cidades", url: "/branches", icon: MapPin, moduleKey: "branches" },
      { key: "sidebar.tema_marca", defaultTitle: "Aparência da Marca", url: "/brands", icon: Palette },
      { key: "sidebar.galeria_icones", defaultTitle: "Biblioteca de Ícones", url: "/icon-library", icon: Image, moduleKey: "icon_library" },
      { key: "sidebar.partner_landing", defaultTitle: "Landing Page Parceiros", url: "/partner-landing-config", icon: FileUp, moduleKey: "partner_landing" },
      { key: "sidebar.welcome_tour", defaultTitle: "Boas-Vindas", url: "/welcome-tour", icon: Rocket, moduleKey: "welcome_tour" },
      { key: "sidebar.profile_links", defaultTitle: "Links do Perfil", url: "/profile-links", icon: FileText, moduleKey: "profile_links" },
      { key: "sidebar.offer_card_config", defaultTitle: "Layout de Ofertas", url: "/offer-card-config", icon: LayoutTemplate },
    ],
  },
  {
    label: "Vitrine Digital",
    items: [
      { key: "sidebar.page_builder", defaultTitle: "Editor de Páginas", url: "/page-builder-v2", icon: Layers, moduleKey: "page_builder" },
      { key: "sidebar.achadinhos", defaultTitle: "Descobertas", url: "/affiliate-deals", icon: Sparkles, moduleKey: "affiliate_deals" },
      { key: "sidebar.categorias_achadinhos", defaultTitle: "Categorias de Descobertas", url: "/affiliate-categories", icon: Sparkles, moduleKey: "affiliate_deals" },
      { key: "sidebar.central_banners", defaultTitle: "Mídia & Banners", url: "/banner-manager", icon: Image, moduleKey: "banners" },
    ],
  },
  {
    label: "Aprovações",
    items: [
      { key: "sidebar.solicitacoes_emissor", defaultTitle: "Solicitações de Upgrade", url: "/emitter-requests", icon: Zap, moduleKey: "earn_points_store" },
      { key: "sidebar.aprovacao_lojas", defaultTitle: "Aprovar Parceiros", url: "/store-approvals", icon: ShieldCheck, moduleKey: "approvals" },
      { key: "sidebar.aprovar_regras", defaultTitle: "Validar Regras", url: "/approve-store-rules", icon: Shield, moduleKey: "earn_points_store" },
      { key: "sidebar.catalogo", defaultTitle: "Catálogo", url: "/store-catalog", icon: PackageSearch, moduleKey: "catalog" },
    ],
  },
  {
    label: "Gestão Comercial",
    items: [
      { key: "sidebar.operador_pdv", defaultTitle: "Caixa PDV", url: "/pdv", icon: ScanLine, moduleKey: "earn_points_store" },
      { key: "sidebar.ofertas", defaultTitle: "Ofertas", url: "/offers", icon: Tag, moduleKey: "offers" },
      { key: "sidebar.resgates", defaultTitle: "Resgates", url: "/redemptions", icon: ReceiptText, moduleKey: "redemption_qr" },
      { key: "sidebar.cupons", defaultTitle: "Cupons", url: "/vouchers", icon: Ticket, moduleKey: "vouchers" },
      { key: "sidebar.parceiros", defaultTitle: "Parceiros", url: "/stores", icon: ShoppingBag, moduleKey: "stores" },
      { key: "sidebar.clientes", defaultTitle: "Clientes", url: "/customers", icon: UserCheck, moduleKey: "wallet" },
      { key: "sidebar.patrocinados", defaultTitle: "Patrocinados", url: "/sponsored-placements", icon: Zap, moduleKey: "stores" },
    ],
  },
  {
    label: "Guias Inteligentes",
    items: [
      { key: "sidebar.jornada", defaultTitle: "Guia do Empreendedor", url: "/brand-journey", icon: Rocket },
      { key: "sidebar.jornada_emissor", defaultTitle: "Guia do Emissor", url: "/emitter-journey", icon: Zap },
      { key: "sidebar.crm_journey", defaultTitle: "Jornada CRM", url: "/crm", icon: Sparkles, moduleKey: "crm" },
    ],
  },
  {
    label: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", defaultTitle: "Pontuar", url: "/earn-points", icon: Coins, moduleKey: "earn_points_store" },
      { key: "sidebar.regras_pontos", defaultTitle: "Regras de Fidelidade", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store" },
      { key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Fidelidade", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store" },
    ],
  },
  {
    label: "Equipe & Acessos",
    items: [
      { key: "sidebar.usuarios", defaultTitle: "Usuários", url: "/users", icon: Users },
      { key: "sidebar.modulos", defaultTitle: "Módulos", url: "/brand-modules", icon: Blocks },
      { key: "sidebar.perm_parceiros", defaultTitle: "Permissão de Parceiros", url: "/brand-permissions", icon: Shield },
      { key: "sidebar.central_acessos", defaultTitle: "Gestão de Acessos", url: "/access-hub", icon: Eye },
      { key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ClipboardList, moduleKey: "audit" },
    ],
  },
  {
    label: "Inteligência & Dados",
    items: [
      { key: "sidebar.relatorios", defaultTitle: "Relatórios", url: "/reports", icon: BarChart3, moduleKey: "reports" },
      { key: "sidebar.configuracoes", defaultTitle: "Configurações", url: "/brand-settings", icon: Settings2 },
    ],
  },
  {
    label: "Cashback Inteligente",
    items: [
      { key: "sidebar.gg_config", defaultTitle: "Config. Cashback", url: "/ganha-ganha-config", icon: Settings2, moduleKey: "ganha_ganha" },
      { key: "sidebar.gg_billing", defaultTitle: "Financeiro Cashback", url: "/ganha-ganha-billing", icon: ReceiptText, moduleKey: "ganha_ganha" },
      { key: "sidebar.gg_closing", defaultTitle: "Fechamento Financeiro", url: "/ganha-ganha-closing", icon: FileText, moduleKey: "ganha_ganha" },
    ],
  },
  {
    label: "Inteligência de Clientes",
    items: [
      { key: "sidebar.crm", defaultTitle: "Inteligência CRM", url: "/crm", icon: TrendingUp, moduleKey: "crm" },
      { key: "sidebar.importar_csv", defaultTitle: "Importação de Dados", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "stores" },
    ],
  },
  {
    label: "Integrações & API",
    items: [
      { key: "sidebar.api_keys", defaultTitle: "APIs & Integrações", url: "/api-keys", icon: Key, moduleKey: "api_keys" },
      { key: "sidebar.api_docs", defaultTitle: "Documentação API", url: "/api-docs", icon: BookOpen, moduleKey: "api_keys" },
      { key: "sidebar.machine", defaultTitle: "Integração Mobilidade", url: "/machine-integration", icon: Car },
      { key: "sidebar.machine_test", defaultTitle: "Lab Webhook", url: "/machine-webhook-test", icon: FlaskConical },
      { key: "sidebar.taxonomia", defaultTitle: "Taxonomia", url: "/taxonomy", icon: FolderTree, moduleKey: "taxonomy" },
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

export function BrandSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isModuleEnabled } = useBrandModules();
  const { getLabel } = useMenuLabels("admin");
  const { name: brandName, logoUrl: brandLogoUrl } = useBrandInfo();
  const { currentBrandId } = useBrandGuard();
  const badges = useSidebarBadges();

  const resolvedGroups = groups.map(group => ({
    ...group,
    items: group.items
      .map(item => {
        if (item.key === "sidebar.tema_marca" && currentBrandId) {
          return { ...item, url: `/brands/${currentBrandId}` };
        }
        return item;
      })
      .filter(item => !item.moduleKey || isModuleEnabled(item.moduleKey)),
  }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={brandName} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <Store className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">{brandName || "Carregando..."}</span>
              <span className="text-xs text-sidebar-foreground/60">Gestão Estratégica</span>
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

        {resolvedGroups.map((group) => {
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
