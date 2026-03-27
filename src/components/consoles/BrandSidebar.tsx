import {
  Store, MapPin, LayoutDashboard, LogOut, Palette, Users,
  FileSpreadsheet, Blocks, Settings2, ScrollText, ShieldCheck, Image, Tag,
  FileText, ClipboardList, Layers, ShoppingBag, UserCheck, ReceiptText, Ticket, RefreshCw,
  Coins, Sparkles, PackageSearch, BarChart3, ScanLine, Shield, FolderTree, Zap, Rocket, Key, BookOpen, Eye, TrendingUp, Crown,
  ChevronRight, Car, FlaskConical, LayoutTemplate, FileUp, Truck,
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
    label: "Guias Inteligentes",
    items: [
      { key: "sidebar.jornada", defaultTitle: "Guia do Empreendedor", url: "/brand-journey", icon: Rocket, moduleKey: "guide_brand" },
      { key: "sidebar.jornada_emissor", defaultTitle: "Guia do Emissor", url: "/emitter-journey", icon: Zap, moduleKey: "guide_emitter" },
    ],
  },
  {
    label: "Personalização & Vitrine",
    items: [
      { key: "sidebar.branches", defaultTitle: "Cidades", url: "/branches", icon: MapPin, moduleKey: "branches" },
      { key: "sidebar.tema_marca", defaultTitle: "Aparência da Marca", url: "/brands", icon: Palette, moduleKey: "brand_theme" },
      { key: "sidebar.galeria_icones", defaultTitle: "Biblioteca de Ícones", url: "/icon-library", icon: Image, moduleKey: "icon_library" },
      { key: "sidebar.partner_landing", defaultTitle: "Landing Page Parceiros", url: "/partner-landing-config", icon: FileUp, moduleKey: "partner_landing" },
      { key: "sidebar.welcome_tour", defaultTitle: "Boas-Vindas", url: "/welcome-tour", icon: Rocket, moduleKey: "welcome_tour" },
      { key: "sidebar.profile_links", defaultTitle: "Links do Perfil", url: "/profile-links", icon: FileText, moduleKey: "profile_links" },
      { key: "sidebar.offer_card_config", defaultTitle: "Layout de Ofertas", url: "/offer-card-config", icon: LayoutTemplate, moduleKey: "offer_card_config" },
      { key: "sidebar.page_builder", defaultTitle: "Editor de Páginas", url: "/page-builder-v2", icon: Layers, moduleKey: "page_builder" },
      { key: "sidebar.achadinhos", defaultTitle: "Achadinhos", url: "/affiliate-deals", icon: Sparkles, moduleKey: "affiliate_deals" },
      { key: "sidebar.categorias_achadinhos", defaultTitle: "Categorias de Achadinhos", url: "/affiliate-categories", icon: Sparkles, moduleKey: "affiliate_deals" },
      { key: "sidebar.espelhamento", defaultTitle: "Espelhamento", url: "/mirror-sync", icon: RefreshCw, moduleKey: "affiliate_deals" },
      { key: "sidebar.governanca_ofertas", defaultTitle: "Governança de Ofertas", url: "/offer-governance", icon: Shield, moduleKey: "affiliate_deals" },
      { key: "sidebar.central_banners", defaultTitle: "Mídia & Banners", url: "/banner-manager", icon: Image, moduleKey: "banners" },
    ],
  },
  {
    label: "Aprovações",
    items: [
      { key: "sidebar.solicitacoes_emissor", defaultTitle: "Solicitações de Upgrade", url: "/emitter-requests", icon: Zap, moduleKey: "multi_emitter" },
      { key: "sidebar.aprovar_regras", defaultTitle: "Validar Regras", url: "/approve-store-rules", icon: Shield, moduleKey: "multi_emitter" },
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
      { key: "sidebar.patrocinados", defaultTitle: "Patrocinados", url: "/sponsored-placements", icon: Zap, moduleKey: "sponsored" },
    ],
  },
  {
    label: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", defaultTitle: "Pontuar", url: "/earn-points", icon: Coins, moduleKey: "earn_points_store" },
      { key: "sidebar.regras_pontos", defaultTitle: "Regras de Fidelidade", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store" },
      { key: "sidebar.tier_pontos", defaultTitle: "Pontuação por Tier", url: "/tier-points-rules", icon: Crown, moduleKey: "earn_points_store" },
      { key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Fidelidade", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store" },
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
    label: "Equipe & Acessos",
    items: [
      { key: "sidebar.usuarios", defaultTitle: "Usuários", url: "/users", icon: Users, moduleKey: "users_management" },
      { key: "sidebar.perm_parceiros", defaultTitle: "Permissão de Parceiros", url: "/brand-permissions", icon: Shield, moduleKey: "store_permissions" },
      { key: "sidebar.central_acessos", defaultTitle: "Gestão de Acessos", url: "/access-hub", icon: Eye, moduleKey: "access_hub" },
      { key: "sidebar.painel_motorista", defaultTitle: "Painel do Motorista", url: "/driver-config", icon: Car },
    ],
  },
  {
    label: "Inteligência & Dados",
    items: [
      { key: "sidebar.crm", defaultTitle: "Inteligência CRM", url: "/crm", icon: TrendingUp, moduleKey: "crm" },
      { key: "sidebar.relatorios", defaultTitle: "Relatórios", url: "/reports", icon: BarChart3, moduleKey: "reports" },
      { key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ClipboardList, moduleKey: "audit" },
      { key: "sidebar.importar_csv", defaultTitle: "Importação de Dados", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "csv_import" },
      { key: "sidebar.taxonomia", defaultTitle: "Taxonomia", url: "/taxonomy", icon: FolderTree, moduleKey: "taxonomy" },
    ],
  },
  {
    label: "Integrações & API",
    items: [
      { key: "sidebar.api_keys", defaultTitle: "APIs & Integrações", url: "/api-keys", icon: Key, moduleKey: "api_keys" },
      { key: "sidebar.api_docs", defaultTitle: "Documentação API", url: "/api-docs", icon: BookOpen, moduleKey: "api_keys" },
      { key: "sidebar.machine", defaultTitle: "Integração Mobilidade", url: "/machine-integration", icon: Car, moduleKey: "machine_integration" },
      { key: "sidebar.machine_test", defaultTitle: "Lab Webhook", url: "/machine-webhook-test", icon: FlaskConical, moduleKey: "machine_integration" },
      { key: "sidebar.driver_points_rules", defaultTitle: "Pontuação Motoristas", url: "/driver-points-rules", icon: Truck, moduleKey: "machine_integration" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { key: "sidebar.modulos", defaultTitle: "Módulos", url: "/brand-modules", icon: Blocks },
      { key: "sidebar.configuracoes", defaultTitle: "Configurações", url: "/brand-settings", icon: Settings2, moduleKey: "brand_settings" },
      { key: "sidebar.subscription", defaultTitle: "Meu Plano", url: "/subscription", icon: Crown, moduleKey: "subscription" },
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
  brandId,
}: {
  label: string;
  items: MenuItem[];
  collapsed: boolean;
  location: { pathname: string };
  getLabel: (key: string) => string;
  badges: Record<string, number>;
  brandId?: string;
}) {
  const hasActiveRoute = items.some(
    (item) =>
      location.pathname === item.url ||
      (item.url !== "/" && location.pathname.startsWith(item.url))
  );

  return (
    <Collapsible defaultOpen={hasActiveRoute} className="group/collapsible">
      {/* Gradient separator between groups */}
      <div className="gradient-separator mx-3" />
      <SidebarGroup className="py-0">
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/30 transition-colors">
          <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          {!collapsed && <span>{label}</span>}
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const badgeCount = badges[item.key];
                const isActive = location.pathname === item.url ||
                  (item.url !== "/" && location.pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={getLabel(item.key)}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`transition-colors rounded-md ${isActive ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                        activeClassName=""
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">{getLabel(item.key)}</span>}
                        {badgeCount && badgeCount > 0 ? (
                          <span className="ml-auto h-2 w-2 rounded-full bg-destructive shrink-0" title={`${badgeCount}`} />
                        ) : null}
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

const BASIC_PLAN_HIDDEN_MODULES = ["page_builder", "icon_library", "subscription"];

export function BrandSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isModuleEnabled } = useBrandModules();
  const { getLabel } = useMenuLabels("admin");
  const { name: brandName, logoUrl: brandLogoUrl, subscriptionPlan } = useBrandInfo();
  const { currentBrandId } = useBrandGuard();
  const badges = useSidebarBadges();

  const isBasicPlan = !subscriptionPlan || subscriptionPlan === "basic" || subscriptionPlan === "free";

  const resolvedGroups = groups.map(group => ({
    ...group,
    items: group.items
      .map(item => {
        if (item.key === "sidebar.tema_marca" && currentBrandId) {
          return { ...item, url: `/brands/${currentBrandId}` };
        }
        return item;
      })
      .filter(item => !item.moduleKey || isModuleEnabled(item.moduleKey))
      .filter(item => !isBasicPlan || !BASIC_PLAN_HIDDEN_MODULES.includes(item.moduleKey ?? "")),
  }));

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={brandName} className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-border" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Store className="h-4 w-4 text-primary" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{brandName || "Carregando..."}</span>
              <span className="text-[10px] text-muted-foreground">Gestão Estratégica</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* Dashboard item */}
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
                    className={`transition-colors rounded-md ${location.pathname === '/' ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                    activeClassName=""
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
              brandId={currentBrandId ?? undefined}
            />
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user?.email && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">{initials}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-medium text-foreground">{user.email.split("@")[0]}</span>
              <span className="truncate text-[10px] text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/40"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
