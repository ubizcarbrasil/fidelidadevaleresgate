import React from "react";
import { LayoutDashboard, LogOut, ChevronRight, Briefcase } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandModules } from "@/hooks/useBrandModules";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { useBranchScoringModel } from "@/hooks/useBranchScoringModel";
import { useBranchModules } from "@/hooks/useBranchModules";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useResolvedModules } from "@/compartilhados/hooks/hook_modulos_resolvidos";
import { useBusinessModelsUiEnabled } from "@/compartilhados/hooks/hook_business_models_ui_flag";
import { USE_RESOLVED_MODULES } from "@/compartilhados/constants/constantes_features";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import PlatformLogo from "@/components/PlatformLogo";
import { useBrandInfo } from "@/hooks/useBrandName";
import { useBranchCityName } from "@/hooks/hook_branch_city";
import {
  MENU_REGISTRY,
  buildSidebarGroups,
  type RegistroItemMenu,
  type DefinicaoGrupoSidebar,
} from "@/compartilhados/constants/constantes_menu_sidebar";

type BranchModuleKey = "enable_duels_module" | "enable_achadinhos_module" | "enable_marketplace_module" | "enable_race_earn_module" | "enable_customer_scoring_module";

const dashboardItem = MENU_REGISTRY["sidebar.dashboard"];

const branchGroupDefs: DefinicaoGrupoSidebar[] = [
  {
    label: "Gestão Comercial",
    scoringFilter: "PASSENGER",
    branchModuleKey: "enable_customer_scoring_module",
    items: [
      "sidebar.operador_pdv", "sidebar.parceiros", "sidebar.ofertas",
      "sidebar.clientes", "sidebar.resgates", "sidebar.cupons",
    ],
  },
  {
    label: "Aprovações",
    scoringFilter: "PASSENGER",
    branchModuleKey: "enable_customer_scoring_module",
    items: ["sidebar.aprovar_regras", "sidebar.catalogo"],
  },
  {
    label: "Achadinhos",
    scoringFilter: "PASSENGER",
    branchModuleKey: "enable_achadinhos_module",
    items: ["sidebar.achadinhos", "sidebar.categorias_achadinhos"],
  },
  {
    label: "Comunicação",
    scoringFilter: "PASSENGER",
    items: ["sidebar.enviar_notificacao"],
  },
  {
    label: "Motoristas & Resgate",
    scoringFilter: "DRIVER",
    branchModuleKey: "enable_race_earn_module",
    items: [
      "sidebar.carteira_pontos", "sidebar.comprar_pontos",
      "sidebar.produtos_resgate", "sidebar.pedidos_resgate",
      { key: "sidebar.motoristas", overrides: { moduleKey: "achadinhos_motorista" } },
      "sidebar.relatorios_cidade", "sidebar.manuais",
    ],
  },
  {
    label: "Programa de Fidelidade",
    scoringFilter: "PASSENGER",
    branchModuleKey: "enable_customer_scoring_module",
    items: ["sidebar.pontuar", "sidebar.regras_pontos", "sidebar.extrato_pontos"],
  },
  {
    label: "Gamificação",
    scoringFilter: "DRIVER",
    branchModuleKey: "enable_duels_module",
    items: ["sidebar.gamificacao"],
  },
  {
    label: "Inteligência & Dados",
    items: ["sidebar.relatorios", "sidebar.auditoria", "sidebar.importar_csv"],
  },
];

const groups = buildSidebarGroups(branchGroupDefs);

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

export function BranchSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const legacyBrandModules = useBrandModules();
  const resolvedModules = useResolvedModules(currentBrandId, currentBranchId);
  const isModuleEnabled = USE_RESOLVED_MODULES
    ? resolvedModules.isModuleEnabled
    : legacyBrandModules.isModuleEnabled;
  const { getLabel } = useMenuLabels("admin");
  const badges = useSidebarBadges();
  const { isDriverEnabled, isPassengerEnabled } = useBranchScoringModel();
  const { isBranchModuleEnabled } = useBranchModules();
  const { name: brandName, logoUrl } = useBrandInfo();
  const cityName = useBranchCityName();
  const { data: businessModelsUiEnabled } = useBusinessModelsUiEnabled(currentBrandId);

  const visibleGroups = groups
    .filter((group) => {
      if (group.scoringFilter === "DRIVER" && !isDriverEnabled) return false;
      if (group.scoringFilter === "PASSENGER" && !isPassengerEnabled) return false;
      if (group.branchModuleKey && !isBranchModuleEnabled(group.branchModuleKey as BranchModuleKey)) return false;
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.moduleKey || isModuleEnabled(item.moduleKey)
      ),
    }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <PlatformLogo src={logoUrl} alt={brandName || "Logo"} className="h-8 w-8 rounded-lg" fallbackLabel={(brandName || "VR").substring(0, 2).toUpperCase()} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">{brandName || "Marca"}</span>
              <span className="text-xs text-sidebar-foreground/60">{cityName || "Gestão Regional"}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {(!dashboardItem.moduleKey || isModuleEnabled(dashboardItem.moduleKey)) && (
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
        )}

        {visibleGroups.map((group) => {
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
        {!collapsed && <div className="mb-2 truncate text-xs text-sidebar-foreground/60">{user?.email}</div>}
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4 mr-2" />{!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default React.memo(BranchSidebar);
