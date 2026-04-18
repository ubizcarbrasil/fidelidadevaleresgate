import React from "react";
import { LayoutDashboard, LogOut, ChevronRight, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBrandModules } from "@/hooks/useBrandModules";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useResolvedModules } from "@/compartilhados/hooks/hook_modulos_resolvidos";
import { USE_RESOLVED_MODULES } from "@/compartilhados/constants/constantes_features";
import { useBrandScoringModels } from "@/hooks/useBrandScoringModels";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import PlatformLogo from "@/components/PlatformLogo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  MENU_REGISTRY,
  buildSidebarGroups,
  type RegistroItemMenu,
  type DefinicaoGrupoSidebar,
} from "@/compartilhados/constants/constantes_menu_sidebar";

const dashboardItem = MENU_REGISTRY["sidebar.dashboard"];

const brandGroupDefs: DefinicaoGrupoSidebar[] = [
  {
    label: "Guias Inteligentes",
    items: [
      "sidebar.jornada", "sidebar.jornada_emissor",
      { key: "sidebar.modulos", overrides: { defaultTitle: "Módulos" } },
    ],
  },
  {
    label: "Manuais",
    items: [
      { key: "sidebar.manuais", overrides: { defaultTitle: "Manuais da Plataforma", moduleKey: undefined } },
    ],
  },
  {
    label: "Cidades",
    items: [
      { key: "sidebar.branches", overrides: { defaultTitle: "Minhas Cidades", url: "/brand-branches" } },
      "sidebar.pacotes_pontos", "sidebar.regras_resgate",
      "sidebar.jornada_cidades", "sidebar.onboarding_cidade", "sidebar.configuracao_cidade",
      "sidebar.configuracao_modulos_cidade",
    ],
  },
  {
    label: "Personalização & Vitrine",
    items: [
      "sidebar.tema_marca", "sidebar.galeria_icones", "sidebar.partner_landing",
      "sidebar.welcome_tour", "sidebar.profile_links", "sidebar.offer_card_config",
      "sidebar.page_builder", "sidebar.central_banners",
    ],
  },
  {
    label: "Achadinhos",
    items: [
      "sidebar.achadinhos", "sidebar.categorias_achadinhos",
      { key: "sidebar.espelhamento", overrides: { defaultTitle: "Espelhar Achadinhos" } },
      { key: "sidebar.governanca_ofertas", overrides: { defaultTitle: "Governança de Achadinhos" } },
    ],
  },
  {
    label: "Resgate com Pontos",
    items: ["sidebar.produtos_resgate", "sidebar.pedidos_resgate"],
  },
  {
    label: "Aprovações",
    items: ["sidebar.solicitacoes_emissor", "sidebar.aprovar_regras", "sidebar.catalogo"],
  },
  {
    label: "Comunicação",
    items: ["sidebar.enviar_notificacao"],
  },
  {
    label: "Gestão Comercial",
    items: [
      { key: "sidebar.operador_pdv", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.ofertas", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.resgates", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.cupons", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.parceiros", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.clientes", overrides: { scoringFilter: "PASSENGER" as const } },
      "sidebar.motoristas", "sidebar.compra_pontos_motorista", "sidebar.patrocinados",
      { key: "sidebar.painel_motorista_view", overrides: { scoringFilter: "DRIVER" as const } },
    ],
  },
  {
    label: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.regras_pontos", overrides: { scoringFilter: "PASSENGER" as const } },
      "sidebar.tier_pontos",
      { key: "sidebar.extrato_pontos", overrides: { scoringFilter: "PASSENGER" as const } },
    ],
  },
  {
    label: "Gamificação",
    items: ["sidebar.gamificacao"],
  },
  {
    label: "Cashback Inteligente",
    items: [
      "sidebar.gg_config",
      "sidebar.gg_billing",
      { key: "sidebar.gg_closing", overrides: { icon: FileText } },
    ],
  },
  {
    label: "Equipe & Acessos",
    // sidebar.perm_parceiros — depreciado: controle migrado para a Central de Módulos
    items: ["sidebar.usuarios", "sidebar.central_acessos"],
  },
  {
    label: "Inteligência & Dados",
    items: [
      "sidebar.crm", "sidebar.relatorios", "sidebar.auditoria",
      { key: "sidebar.importar_csv", overrides: { moduleKey: "csv_import" } },
      "sidebar.taxonomia",
    ],
  },
  {
    label: "Integrações & API",
    items: [
      "sidebar.api_keys", "sidebar.api_docs", "sidebar.machine",
      { key: "sidebar.teste_webhook", overrides: { defaultTitle: "Lab Webhook" } },
      "sidebar.api_journey",
    ],
  },
  {
    label: "Configurações",
    items: [
      "sidebar.dominios_marca", "sidebar.configuracoes", "sidebar.painel_motorista",
      { key: "sidebar.subscription", overrides: { defaultTitle: "Meu Plano" } },
    ],
  },
];

const groups = buildSidebarGroups(brandGroupDefs);

function CollapsibleGroup({
  label, items, collapsed, location, getLabel, badges, brandId, isOpen, onToggle,
}: {
  label: string;
  items: RegistroItemMenu[];
  collapsed: boolean;
  location: { pathname: string };
  getLabel: (key: string) => string;
  badges: Record<string, number>;
  brandId?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="group/collapsible">
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
                const isActive = location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={getLabel(item.key)}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`transition-colors rounded-md ${isActive ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                        activeClassName=""
                        onClick={() => setOpenMobile(false)}
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
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const legacyBrandModules = useBrandModules();
  const { getLabel } = useMenuLabels("admin");
  const { name: brandName, logoUrl: brandLogoUrl, subscriptionPlan, brandId: infoBrandId } = useBrandInfo();
  const { currentBrandId } = useBrandGuard();
  const { isDriverEnabled, isPassengerEnabled } = useBrandScoringModels();
  const badges = useSidebarBadges();
  const [openGroupLabel, setOpenGroupLabel] = useState<string | null>(null);

  const effectiveBrandId = currentBrandId || infoBrandId;
  const resolvedModules = useResolvedModules(effectiveBrandId);
  const isModuleEnabled = USE_RESOLVED_MODULES
    ? resolvedModules.isModuleEnabled
    : legacyBrandModules.isModuleEnabled;

  const { data: sidebarOrder } = useQuery({
    queryKey: ["brand-sidebar-order", effectiveBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", effectiveBrandId!)
        .single();
      if (error) throw error;
      const settings = data?.brand_settings_json as Record<string, any> | null;
      if (settings?.sidebar_group_order && Array.isArray(settings.sidebar_group_order)) {
        return settings.sidebar_group_order as string[];
      }
      return null;
    },
    enabled: !!effectiveBrandId,
    staleTime: 60_000,
  });

  const isBasicPlan = !subscriptionPlan || subscriptionPlan === "basic" || subscriptionPlan === "free";

  const resolvedGroups = groups.map(group => ({
    ...group,
    items: group.items
      .map(item => {
        if (item.key === "sidebar.tema_marca" && currentBrandId) {
          return { ...item, url: `/brands/${currentBrandId}` };
        }
        if (item.key === "sidebar.painel_motorista_view" && effectiveBrandId) {
          return { ...item, url: `/driver?brandId=${effectiveBrandId}` };
        }
        return item;
      })
      .filter(item => !item.moduleKey || isModuleEnabled(item.moduleKey))
      .filter(item => !isBasicPlan || !BASIC_PLAN_HIDDEN_MODULES.includes(item.moduleKey ?? ""))
      .filter(item => {
        if (!item.scoringFilter) return true;
        if (item.scoringFilter === "DRIVER") return isDriverEnabled;
        if (item.scoringFilter === "PASSENGER") return isPassengerEnabled;
        return true;
      }),
  }));

  const sortedGroups = sidebarOrder
    ? [...resolvedGroups].sort((a, b) => {
        const idxA = sidebarOrder.indexOf(a.label);
        const idxB = sidebarOrder.indexOf(b.label);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      })
    : resolvedGroups;

  const activeGroupLabel = sortedGroups.find(g =>
    g.items.some(item => location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url)))
  )?.label || null;

  const effectiveOpenGroup = openGroupLabel ?? activeGroupLabel;

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <PlatformLogo src={brandLogoUrl} alt={brandName} className="h-8 w-8 rounded-lg ring-1 ring-border" fallbackLabel={brandName?.substring(0, 2).toUpperCase()} />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{brandName || "Carregando..."}</span>
              <span className="text-[10px] text-muted-foreground">Gestão Estratégica</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"} tooltip={getLabel(dashboardItem.key)}>
                  <NavLink
                    to="/" end
                    className={`transition-colors rounded-md ${location.pathname === '/' ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                    activeClassName=""
                    onClick={() => setOpenMobile(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span className="flex-1">{getLabel(dashboardItem.key)}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {sortedGroups.map((group) => {
          if (group.items.length === 0) return null;
          const alwaysOpen = group.label === "Resgate com Pontos";
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
              isOpen={alwaysOpen || effectiveOpenGroup === group.label}
              onToggle={alwaysOpen ? () => {} : () => setOpenGroupLabel((prev: string | null) => prev === group.label ? null : group.label)}
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
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/40">
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default React.memo(BrandSidebar);
