import {
  Store, MapPin, LayoutDashboard, LogOut, Globe, Palette, Layout, Users,
  FileSpreadsheet, Blocks, Settings2, ScrollText, ShieldCheck, Image, Tag, Type,
  FileText, ClipboardList, Layers, ShoppingBag, UserCheck, ReceiptText, Ticket,
  Coins, Sparkles, PackageSearch, BarChart3, Bell, ScanLine, Shield, FolderTree, Zap, Rocket, Key,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandModules } from "@/hooks/useBrandModules";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useBrandGuard } from "@/hooks/useBrandGuard";
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
      { key: "sidebar.jornada", defaultTitle: "Jornada do Empreendedor", url: "/brand-journey", icon: Rocket },
      { key: "sidebar.jornada_emissor", defaultTitle: "Jornada do Emissor", url: "/emitter-journey", icon: Zap },
    ],
  },
  {
    label: "🎨 Identidade Visual",
    items: [
      { key: "sidebar.tema_marca", defaultTitle: "Aparência da Marca", url: "/brands", icon: Palette },
      { key: "sidebar.dominios", defaultTitle: "Domínios", url: "/domains", icon: Globe },
      { key: "sidebar.galeria_icones", defaultTitle: "Galeria de Ícones", url: "/icon-library", icon: Image },
      { key: "sidebar.app_icons", defaultTitle: "Ícones do App", url: "/app-icons", icon: Palette },
    ],
  },
  {
    label: "📱 Vitrine do App",
    items: [
      { key: "sidebar.secoes_home", defaultTitle: "Seções da Tela Inicial", url: "/templates", icon: Layout, moduleKey: "home_sections" },
      { key: "sidebar.central_banners", defaultTitle: "Central de Propagandas", url: "/banner-manager", icon: Image },
      { key: "sidebar.nomes_rotulos", defaultTitle: "Nomes e Rótulos", url: "/menu-labels", icon: Type },
      { key: "sidebar.page_builder", defaultTitle: "Construtor de Páginas", url: "/page-builder", icon: Layers },
      
    ],
  },
  {
    label: "🏪 Operações",
    items: [
      { key: "sidebar.branches", defaultTitle: "Cidades", url: "/branches", icon: MapPin },
      { key: "sidebar.parceiros", defaultTitle: "Parceiros", url: "/stores", icon: ShoppingBag, moduleKey: "stores" },
      { key: "sidebar.ofertas", defaultTitle: "Ofertas", url: "/offers", icon: Tag, moduleKey: "offers" },
      { key: "sidebar.clientes", defaultTitle: "Clientes", url: "/customers", icon: UserCheck, moduleKey: "wallet" },
      { key: "sidebar.resgates", defaultTitle: "Resgates", url: "/redemptions", icon: ReceiptText, moduleKey: "redemption_qr" },
      { key: "sidebar.cupons", defaultTitle: "Cupons", url: "/vouchers", icon: Ticket, moduleKey: "vouchers" },
      { key: "sidebar.aprovacao_lojas", defaultTitle: "Aprovação de Parceiros", url: "/store-approvals", icon: ShieldCheck, moduleKey: "stores" },
      { key: "sidebar.aprovar_regras", defaultTitle: "Aprovar Regras", url: "/approve-store-rules", icon: Shield, moduleKey: "earn_points_store" },
      { key: "sidebar.solicitacoes_emissor", defaultTitle: "Solicitações de Emissor", url: "/emitter-requests", icon: Zap, moduleKey: "earn_points_store" },
      { key: "sidebar.importar_csv", defaultTitle: "Importar Planilha", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "stores" },
      { key: "sidebar.achadinhos", defaultTitle: "Achadinhos", url: "/affiliate-deals", icon: Sparkles },
      { key: "sidebar.catalogo", defaultTitle: "Catálogo", url: "/store-catalog", icon: PackageSearch, moduleKey: "stores" },
      { key: "sidebar.enviar_notificacao", defaultTitle: "Enviar Notificação", url: "/send-notification", icon: Bell },
      { key: "sidebar.operador_pdv", defaultTitle: "Operador PDV", url: "/pdv", icon: ScanLine },
    ],
  },
  {
    label: "💰 Programa de Pontos",
    items: [
      { key: "sidebar.pontuar", defaultTitle: "Pontuar", url: "/earn-points", icon: Coins, moduleKey: "earn_points_store" },
      { key: "sidebar.regras_pontos", defaultTitle: "Regras de Pontos", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store" },
      { key: "sidebar.regra_parceiro", defaultTitle: "Regra de Pontos do Parceiro", url: "/store-points-rule", icon: Coins, moduleKey: "earn_points_store" },
      { key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Pontos", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store" },
    ],
  },
  {
    label: "🤝 Ganha-Ganha",
    items: [
      { key: "sidebar.gg_config", defaultTitle: "Configuração GG", url: "/ganha-ganha-config", icon: Settings2, moduleKey: "ganha_ganha" },
      { key: "sidebar.gg_billing", defaultTitle: "Painel Financeiro GG", url: "/ganha-ganha-billing", icon: ReceiptText, moduleKey: "ganha_ganha" },
      { key: "sidebar.gg_closing", defaultTitle: "Fechamento Mensal", url: "/ganha-ganha-closing", icon: FileText, moduleKey: "ganha_ganha" },
    ],
  },
  {
    label: "👥 Usuários & Permissões",
    items: [
      { key: "sidebar.usuarios", defaultTitle: "Usuários", url: "/users", icon: Users },
      { key: "sidebar.modulos", defaultTitle: "Funcionalidades", url: "/brand-modules", icon: Blocks },
      { key: "sidebar.perm_parceiros", defaultTitle: "Permissões dos Parceiros", url: "/brand-permissions", icon: Shield },
      { key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ClipboardList },
    ],
  },
  {
    label: "📈 Análises",
    items: [
      { key: "sidebar.relatorios", defaultTitle: "Relatórios", url: "/reports", icon: BarChart3 },
      { key: "sidebar.taxonomia", defaultTitle: "Taxonomia", url: "/taxonomy", icon: FolderTree },
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
  const { name: brandName, logoUrl: brandLogoUrl } = useBrandInfo();
  const { currentBrandId } = useBrandGuard();

  // Dynamically resolve brand theme URL
  const resolvedGroups = groups.map(group => ({
    ...group,
    items: group.items.map(item => {
      if (item.key === "sidebar.tema_marca" && currentBrandId) {
        return { ...item, url: `/brands/${currentBrandId}` };
      }
      return item;
    }),
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
              <span className="text-xs text-sidebar-foreground/60">Painel do Empreendedor</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {resolvedGroups.map((group) => {
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
                        tooltip={getLabel(item.key)}
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
