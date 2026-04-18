import {
  LayoutDashboard, LogOut, ExternalLink, ChevronRight, Palette, Shield,
  ShieldCheck, ScrollText, Copy, FileText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import PlatformLogo from "@/components/PlatformLogo";
import {
  MENU_REGISTRY,
  buildSidebarGroups,
  type RegistroItemMenu,
  type DefinicaoGrupoSidebar,
} from "@/compartilhados/constants/constantes_menu_sidebar";

const dashboardItem = MENU_REGISTRY["sidebar.dashboard"];

const rootGroupDefs: DefinicaoGrupoSidebar[] = [
  {
    label: "Guias Inteligentes",
    items: ["sidebar.jornada_root", "sidebar.jornada", "sidebar.jornada_emissor"],
  },
  {
    label: "Organização",
    items: [
      "sidebar.empresas", "sidebar.marcas",
      { key: "sidebar.branches", overrides: { url: "/branches" } },
      "sidebar.clonar_cidade", "sidebar.dominios", "sidebar.painel_motorista",
      "sidebar.provisionar_marca", "sidebar.central_acessos",
    ],
  },
  {
    label: "Personalização & Vitrine",
    items: [
      { key: "sidebar.galeria_icones", overrides: { icon: Palette } },
      "sidebar.app_icons", "sidebar.central_banners", "sidebar.nomes_rotulos",
      "sidebar.page_builder", "sidebar.tema_plataforma", "sidebar.welcome_tour",
      "sidebar.profile_links",
      { key: "sidebar.partner_landing", overrides: { icon: FileText } },
    ],
  },
  {
    label: "Gestão Comercial",
    items: [
      "sidebar.operador_pdv", "sidebar.parceiros", "sidebar.ofertas",
      "sidebar.clientes", "sidebar.resgates", "sidebar.cupons",
      "sidebar.achadinhos", "sidebar.categorias_achadinhos",
      "sidebar.importar_csv", "sidebar.patrocinados",
    ],
  },
  {
    label: "Aprovações",
    items: [
      { key: "sidebar.aprovar_regras", overrides: { icon: Shield } },
      "sidebar.solicitacoes_emissor", "sidebar.catalogo",
      { key: "sidebar.espelhamento", overrides: { icon: Copy } },
      "sidebar.governanca_ofertas",
    ],
  },
  {
    label: "Comunicação",
    items: ["sidebar.enviar_notificacao"],
  },
  {
    label: "Programa de Fidelidade",
    items: ["sidebar.pontuar", "sidebar.regras_pontos", "sidebar.extrato_pontos"],
  },
  {
    label: "Cashback Inteligente",
    items: [
      "sidebar.gg_dashboard", "sidebar.gg_config", "sidebar.gg_billing",
      { key: "sidebar.gg_closing", overrides: { icon: ScrollText } },
      "sidebar.gg_store_summary",
    ],
  },
  {
    label: "Equipe & Acessos",
    items: [
      "sidebar.usuarios",
      { key: "sidebar.perm_parceiros", overrides: { icon: ShieldCheck } },
    ],
  },
  {
    label: "Inteligência & Dados",
    items: [
      "sidebar.crm", "sidebar.relatorios",
      { key: "sidebar.auditoria", overrides: { icon: ScrollText } },
      "sidebar.taxonomia",
    ],
  },
  {
    label: "Integrações & API",
    items: ["sidebar.api_keys", "sidebar.api_docs", "sidebar.machine", "sidebar.teste_webhook"],
  },
  {
    label: "Configurações",
    items: [
      { key: "sidebar.central_modulos", overrides: { defaultTitle: "Central de Módulos" } },
      "sidebar.funcionalidades",
      { key: "sidebar.modulos", overrides: { defaultTitle: "Módulos das Marcas" } },
      "sidebar.permissoes_globais", "sidebar.secoes_home", "sidebar.modelos_home",
      "sidebar.controle_recursos", "sidebar.atualizacoes", "sidebar.kit_inicial",
      "sidebar.configuracoes",
      { key: "sidebar.subscription", overrides: { defaultTitle: "Assinatura" } },
      "sidebar.plan_templates", "sidebar.plan_pricing",
    ],
  },
];

const groups = buildSidebarGroups(rootGroupDefs);

function CollapsibleGroup({
  label, items, collapsed, location, getLabel, badges,
}: {
  label: string;
  items: RegistroItemMenu[];
  collapsed: boolean;
  location: { pathname: string };
  getLabel: (key: string) => string;
  badges: Record<string, number>;
}) {
  const hasActiveRoute = items.some(
    (item) => location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))
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
                const isNovo = item.key === "sidebar.central_modulos";
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url))}
                      tooltip={getLabel(item.key)}
                    >
                      <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">{getLabel(item.key)}</span>}
                        {!collapsed && isNovo && (
                          <Badge className="ml-auto h-5 px-1.5 text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-500">
                            Novo
                          </Badge>
                        )}
                        {!isNovo && badgeCount && badgeCount > 0 && (
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

  const { data: brands } = useQuery({
    queryKey: ["brands-for-sidebar"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name, slug").eq("is_active", true).order("name");
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <PlatformLogo className="h-8 w-8 rounded-lg" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Vale Resgate</span>
              <span className="text-xs text-sidebar-foreground/60">Central de Comando</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"} tooltip={getLabel(dashboardItem.key)}>
                  <NavLink to="/" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span className="flex-1">{getLabel(dashboardItem.key)}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((group) => (
          <CollapsibleGroup key={group.label} label={group.label} items={group.items} collapsed={collapsed} location={location} getLabel={getLabel} badges={badges} />
        ))}

        <Collapsible defaultOpen={false} className="group/collapsible">
          <SidebarGroup className="py-0">
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              {!collapsed && <span>Links Públicos</span>}
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Landing Empreendedor">
                      <a href={`${window.location.origin}/landing`} target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">Landing Empreendedor</span>}
                        {!collapsed && <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] font-medium text-sidebar-foreground/60 border-sidebar-foreground/20">Externo</Badge>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {brands && brands.length === 1 ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Landing Parceiros">
                        <a href={`${window.location.origin}/${brands[0].slug}/parceiro`} target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {!collapsed && <span className="flex-1">Landing Parceiros</span>}
                          {!collapsed && <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] font-medium text-sidebar-foreground/60 border-sidebar-foreground/20">Externo</Badge>}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    brands?.map((brand) => (
                      <SidebarMenuItem key={brand.id}>
                        <SidebarMenuButton asChild tooltip={`Parceiros – ${brand.name}`}>
                          <a href={`${window.location.origin}/${brand.slug}/parceiro`} target="_blank" rel="noopener noreferrer" className="hover:bg-sidebar-accent/50 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            {!collapsed && <span className="flex-1 truncate">{brand.name}</span>}
                            {!collapsed && <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] font-medium text-sidebar-foreground/60 border-sidebar-foreground/20">Externo</Badge>}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
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
