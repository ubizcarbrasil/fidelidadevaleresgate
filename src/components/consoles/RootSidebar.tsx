import {
  LayoutDashboard, LogOut, ExternalLink, ChevronRight,
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
    items: [
      "sidebar.jornada_root",
      { key: "sidebar.jornada", overrides: { moduleKey: undefined } },
      { key: "sidebar.jornada_emissor", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Organização",
    items: [
      "sidebar.empresas",
      "sidebar.marcas",
      { key: "sidebar.branches", overrides: { url: "/branches" } },
      "sidebar.clonar_cidade",
      "sidebar.dominios",
      "sidebar.painel_motorista",
      "sidebar.provisionar_marca",
      { key: "sidebar.central_acessos", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Personalização & Vitrine",
    items: [
      { key: "sidebar.galeria_icones", overrides: { icon: (await import("lucide-react")).Palette, moduleKey: undefined } },
      "sidebar.app_icons",
      { key: "sidebar.central_banners", overrides: { moduleKey: undefined } },
      "sidebar.nomes_rotulos",
      { key: "sidebar.page_builder", overrides: { moduleKey: undefined } },
      "sidebar.tema_plataforma",
      { key: "sidebar.welcome_tour", overrides: { moduleKey: undefined } },
      { key: "sidebar.profile_links", overrides: { moduleKey: undefined } },
      { key: "sidebar.partner_landing", overrides: { icon: (await import("lucide-react")).FileText, moduleKey: undefined } },
    ],
  },
  {
    label: "Gestão Comercial",
    items: [
      { key: "sidebar.operador_pdv", overrides: { moduleKey: undefined } },
      { key: "sidebar.parceiros", overrides: { moduleKey: undefined } },
      { key: "sidebar.ofertas", overrides: { moduleKey: undefined } },
      { key: "sidebar.clientes", overrides: { moduleKey: undefined } },
      { key: "sidebar.resgates", overrides: { moduleKey: undefined } },
      { key: "sidebar.cupons", overrides: { moduleKey: undefined } },
      { key: "sidebar.achadinhos", overrides: { moduleKey: undefined } },
      { key: "sidebar.categorias_achadinhos", overrides: { moduleKey: undefined } },
      { key: "sidebar.importar_csv", overrides: { moduleKey: undefined } },
      { key: "sidebar.patrocinados", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Aprovações",
    items: [
      { key: "sidebar.aprovar_regras", overrides: { icon: (await import("lucide-react")).Shield, moduleKey: undefined } },
      { key: "sidebar.solicitacoes_emissor", overrides: { moduleKey: undefined } },
      { key: "sidebar.catalogo", overrides: { moduleKey: undefined } },
      { key: "sidebar.espelhamento", overrides: { icon: (await import("lucide-react")).Copy, moduleKey: undefined } },
      { key: "sidebar.governanca_ofertas", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { key: "sidebar.enviar_notificacao", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", overrides: { moduleKey: undefined } },
      { key: "sidebar.regras_pontos", overrides: { moduleKey: undefined } },
      { key: "sidebar.extrato_pontos", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Cashback Inteligente",
    items: [
      "sidebar.gg_dashboard",
      { key: "sidebar.gg_config", overrides: { moduleKey: undefined } },
      { key: "sidebar.gg_billing", overrides: { moduleKey: undefined } },
      { key: "sidebar.gg_closing", overrides: { icon: (await import("lucide-react")).ScrollText, moduleKey: undefined } },
      "sidebar.gg_store_summary",
    ],
  },
  {
    label: "Equipe & Acessos",
    items: [
      { key: "sidebar.usuarios", overrides: { moduleKey: undefined } },
      { key: "sidebar.perm_parceiros", overrides: { icon: (await import("lucide-react")).ShieldCheck, moduleKey: undefined } },
    ],
  },
  {
    label: "Inteligência & Dados",
    items: [
      { key: "sidebar.crm", overrides: { moduleKey: undefined } },
      { key: "sidebar.relatorios", overrides: { moduleKey: undefined } },
      { key: "sidebar.auditoria", overrides: { icon: (await import("lucide-react")).ScrollText, moduleKey: undefined } },
      { key: "sidebar.taxonomia", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Integrações & API",
    items: [
      { key: "sidebar.api_keys", overrides: { moduleKey: undefined } },
      { key: "sidebar.api_docs", overrides: { moduleKey: undefined } },
      { key: "sidebar.machine", overrides: { moduleKey: undefined } },
      { key: "sidebar.teste_webhook", overrides: { moduleKey: undefined } },
    ],
  },
  {
    label: "Configurações",
    items: [
      "sidebar.funcionalidades",
      { key: "sidebar.modulos", overrides: { defaultTitle: "Módulos das Marcas" } },
      "sidebar.permissoes_globais",
      "sidebar.secoes_home",
      "sidebar.modelos_home",
      "sidebar.controle_recursos",
      "sidebar.atualizacoes",
      "sidebar.kit_inicial",
      { key: "sidebar.configuracoes", overrides: { moduleKey: undefined } },
      { key: "sidebar.subscription", overrides: { defaultTitle: "Assinatura", moduleKey: undefined } },
      "sidebar.plan_templates",
      "sidebar.plan_pricing",
    ],
  },
];

const groups = buildSidebarGroups(rootGroupDefs);

function CollapsibleGroup({
  label,
  items,
  collapsed,
  location,
  getLabel,
  badges,
}: {
  label: string;
  items: RegistroItemMenu[];
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

  const { data: brands } = useQuery({
    queryKey: ["brands-for-sidebar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
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
                      <a
                        href={`${window.location.origin}/landing`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:bg-sidebar-accent/50 flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">Landing Empreendedor</span>}
                        {!collapsed && <Badge variant="outline" className="ml-auto h-5 px-1.5 text-[10px] font-medium text-sidebar-foreground/60 border-sidebar-foreground/20">Externo</Badge>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {brands && brands.length === 1 ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Landing Parceiros">
                        <a
                          href={`${window.location.origin}/${brands[0].slug}/parceiro`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:bg-sidebar-accent/50 flex items-center gap-2"
                        >
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
                          <a
                            href={`${window.location.origin}/${brand.slug}/parceiro`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:bg-sidebar-accent/50 flex items-center gap-2"
                          >
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
