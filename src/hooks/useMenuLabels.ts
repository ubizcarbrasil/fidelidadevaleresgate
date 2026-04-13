import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

export interface LabelGroup {
  groupLabel: string;
  items: { key: string; defaultLabel: string }[];
}

const BRAND_SIDEBAR_GROUPS: LabelGroup[] = [
  {
    groupLabel: "Guias Inteligentes",
    items: [
      { key: "sidebar.jornada", defaultLabel: "Guia do Empreendedor" },
      { key: "sidebar.jornada_emissor", defaultLabel: "Guia do Emissor" },
      { key: "sidebar.modulos", defaultLabel: "Módulos" },
    ],
  },
  {
    groupLabel: "Manuais",
    items: [
      { key: "sidebar.manuais", defaultLabel: "Manuais da Plataforma" },
    ],
  },
  {
    groupLabel: "Cidades",
    items: [
      { key: "sidebar.branches", defaultLabel: "Minhas Cidades" },
      { key: "sidebar.pacotes_pontos", defaultLabel: "Pacotes de Pontos" },
      { key: "sidebar.regras_resgate", defaultLabel: "Regras de Resgate" },
      { key: "sidebar.conversao_resgate", defaultLabel: "Conversão por Público" },
      { key: "sidebar.jornada_cidades", defaultLabel: "Guia de Cidades" },
      { key: "sidebar.onboarding_cidade", defaultLabel: "Onboarding Cidade" },
    ],
  },
  {
    groupLabel: "Personalização & Vitrine",
    items: [
      { key: "sidebar.tema_marca", defaultLabel: "Identidade Visual" },
      { key: "sidebar.galeria_icones", defaultLabel: "Biblioteca de Ícones" },
      { key: "sidebar.partner_landing", defaultLabel: "Landing Page Parceiros" },
      { key: "sidebar.welcome_tour", defaultLabel: "Boas-Vindas" },
      { key: "sidebar.profile_links", defaultLabel: "Links do Perfil" },
      { key: "sidebar.offer_card_config", defaultLabel: "Layout de Ofertas" },
      { key: "sidebar.page_builder", defaultLabel: "Editor de Páginas" },
      { key: "sidebar.central_banners", defaultLabel: "Mídia & Banners" },
    ],
  },
  {
    groupLabel: "Achadinhos",
    items: [
      { key: "sidebar.achadinhos", defaultLabel: "Achadinhos" },
      { key: "sidebar.categorias_achadinhos", defaultLabel: "Categorias de Achadinhos" },
      { key: "sidebar.espelhamento", defaultLabel: "Espelhamento Achadinho" },
      { key: "sidebar.governanca_ofertas", defaultLabel: "Governança Achadinho" },
      { key: "sidebar.driver_points_rules", defaultLabel: "Regras de Pontuação Motorista" },
    ],
  },
  {
    groupLabel: "Resgate com Pontos",
    items: [
      { key: "sidebar.produtos_resgate", defaultLabel: "Produtos de Resgate" },
      { key: "sidebar.pedidos_resgate", defaultLabel: "Pedidos de Resgate" },
    ],
  },
  {
    groupLabel: "Aprovações",
    items: [
      { key: "sidebar.solicitacoes_emissor", defaultLabel: "Solicitações de Upgrade" },
      { key: "sidebar.aprovar_regras", defaultLabel: "Validar Regras" },
      { key: "sidebar.catalogo", defaultLabel: "Catálogo" },
    ],
  },
  {
    groupLabel: "Comunicação",
    items: [
      { key: "sidebar.enviar_notificacao", defaultLabel: "Enviar Notificação" },
    ],
  },
  {
    groupLabel: "Gestão Comercial",
    items: [
      { key: "sidebar.operador_pdv", defaultLabel: "Caixa PDV" },
      { key: "sidebar.ofertas", defaultLabel: "Ofertas" },
      { key: "sidebar.resgates", defaultLabel: "Resgates" },
      { key: "sidebar.cupons", defaultLabel: "Cupons" },
      { key: "sidebar.parceiros", defaultLabel: "Parceiros" },
      { key: "sidebar.clientes", defaultLabel: "Clientes" },
      { key: "sidebar.motoristas", defaultLabel: "Motoristas" },
      { key: "sidebar.patrocinados", defaultLabel: "Patrocinados" },
    ],
  },
  {
    groupLabel: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", defaultLabel: "Pontuar" },
      { key: "sidebar.regras_pontos", defaultLabel: "Regras de Fidelidade" },
      { key: "sidebar.tier_pontos", defaultLabel: "Pontuação por Tier" },
      { key: "sidebar.extrato_pontos", defaultLabel: "Extrato de Fidelidade" },
    ],
  },
  {
    groupLabel: "Gamificação",
    items: [
      { key: "sidebar.gamificacao", defaultLabel: "Duelos & Ranking" },
    ],
  },
  {
    groupLabel: "Cashback Inteligente",
    items: [
      { key: "sidebar.gg_config", defaultLabel: "Config. Cashback" },
      { key: "sidebar.gg_billing", defaultLabel: "Financeiro Cashback" },
      { key: "sidebar.gg_closing", defaultLabel: "Fechamento Financeiro" },
    ],
  },
  {
    groupLabel: "Equipe & Acessos",
    items: [
      { key: "sidebar.usuarios", defaultLabel: "Usuários" },
      { key: "sidebar.perm_parceiros", defaultLabel: "Permissão de Parceiros" },
      { key: "sidebar.central_acessos", defaultLabel: "Gestão de Acessos" },
    ],
  },
  {
    groupLabel: "Inteligência & Dados",
    items: [
      { key: "sidebar.crm", defaultLabel: "Inteligência CRM" },
      { key: "sidebar.relatorios", defaultLabel: "Relatórios" },
      { key: "sidebar.auditoria", defaultLabel: "Auditoria" },
      { key: "sidebar.importar_csv", defaultLabel: "Importação de Dados" },
      { key: "sidebar.taxonomia", defaultLabel: "Taxonomia" },
    ],
  },
  {
    groupLabel: "Integrações & API",
    items: [
      { key: "sidebar.api_keys", defaultLabel: "APIs & Integrações" },
      { key: "sidebar.api_docs", defaultLabel: "Documentação API" },
      { key: "sidebar.machine", defaultLabel: "Integração Mobilidade" },
      { key: "sidebar.machine_test", defaultLabel: "Lab Webhook" },
      { key: "sidebar.api_journey", defaultLabel: "Guia da API" },
    ],
  },
  {
    groupLabel: "Configurações",
    items: [
      { key: "sidebar.dominios_marca", defaultLabel: "Meus Domínios" },
      { key: "sidebar.configuracoes", defaultLabel: "Configurações" },
      { key: "sidebar.painel_motorista", defaultLabel: "Painel do Motorista" },
      { key: "sidebar.subscription", defaultLabel: "Meu Plano" },
    ],
  },
];

const BRANCH_SIDEBAR_GROUPS: LabelGroup[] = [
  {
    groupLabel: "Gestão Comercial",
    items: [
      { key: "sidebar.operador_pdv", defaultLabel: "Caixa PDV" },
      { key: "sidebar.parceiros", defaultLabel: "Parceiros" },
      { key: "sidebar.ofertas", defaultLabel: "Ofertas" },
      { key: "sidebar.clientes", defaultLabel: "Clientes" },
      { key: "sidebar.resgates", defaultLabel: "Resgates" },
      { key: "sidebar.cupons", defaultLabel: "Cupons" },
    ],
  },
  {
    groupLabel: "Aprovações",
    items: [
      { key: "sidebar.aprovar_regras", defaultLabel: "Validar Regras" },
      { key: "sidebar.catalogo", defaultLabel: "Catálogo" },
    ],
  },
  {
    groupLabel: "Achadinhos",
    items: [
      { key: "sidebar.achadinhos", defaultLabel: "Achadinhos" },
      { key: "sidebar.categorias_achadinhos", defaultLabel: "Categorias de Achadinhos" },
    ],
  },
  {
    groupLabel: "Comunicação",
    items: [
      { key: "sidebar.enviar_notificacao", defaultLabel: "Enviar Notificação" },
    ],
  },
  {
    groupLabel: "Motoristas & Resgate",
    items: [
      { key: "sidebar.carteira_pontos", defaultLabel: "Carteira de Pontos" },
      { key: "sidebar.comprar_pontos", defaultLabel: "Comprar Pontos" },
      { key: "sidebar.regras_motorista", defaultLabel: "Regras de Pontuação" },
      { key: "sidebar.produtos_resgate", defaultLabel: "Produtos de Resgate" },
      { key: "sidebar.pedidos_resgate", defaultLabel: "Pedidos de Resgate" },
      { key: "sidebar.motoristas", defaultLabel: "Motoristas" },
      { key: "sidebar.relatorios_cidade", defaultLabel: "Relatórios" },
      { key: "sidebar.manuais", defaultLabel: "Manuais" },
    ],
  },
  {
    groupLabel: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", defaultLabel: "Pontuar" },
      { key: "sidebar.regras_pontos", defaultLabel: "Regras de Fidelidade" },
      { key: "sidebar.extrato_pontos", defaultLabel: "Extrato de Fidelidade" },
    ],
  },
  {
    groupLabel: "Gamificação",
    items: [
      { key: "sidebar.gamificacao", defaultLabel: "Duelos & Ranking" },
    ],
  },
  {
    groupLabel: "Inteligência & Dados",
    items: [
      { key: "sidebar.relatorios", defaultLabel: "Relatórios" },
      { key: "sidebar.auditoria", defaultLabel: "Auditoria" },
      { key: "sidebar.importar_csv", defaultLabel: "Importação de Dados" },
    ],
  },
];

const APP_GROUPS: LabelGroup[] = [
  {
    groupLabel: "App do Cliente",
    items: [
      { key: "app.ofertas", defaultLabel: "Ofertas" },
      { key: "app.cupons", defaultLabel: "Cupons" },
      { key: "app.lojas", defaultLabel: "Lojas" },
      { key: "app.pontos", defaultLabel: "Pontos" },
      { key: "app.carteira", defaultLabel: "Carteira" },
      { key: "app.perfil", defaultLabel: "Perfil" },
      { key: "app.favoritos", defaultLabel: "Favoritos" },
    ],
  },
];

function buildDefaultsMap(groups: LabelGroup[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const g of groups) {
    for (const item of g.items) {
      map[item.key] = item.defaultLabel;
    }
  }
  return map;
}

export type MenuLabelContext = "admin" | "customer_app";

export function getGroupsForTab(tab: "brand" | "branch" | "customer_app"): LabelGroup[] {
  if (tab === "brand") return BRAND_SIDEBAR_GROUPS;
  if (tab === "branch") return BRANCH_SIDEBAR_GROUPS;
  return APP_GROUPS;
}

export function getContextForTab(tab: "brand" | "branch" | "customer_app"): MenuLabelContext {
  if (tab === "customer_app") return "customer_app";
  return "admin";
}

export function useMenuLabels(context: MenuLabelContext) {
  const { currentBrandId } = useBrandGuard();

  const { data: customLabels } = useQuery({
    queryKey: ["menu-labels", currentBrandId, context],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data } = await supabase
        .from("menu_labels")
        .select("key, custom_label")
        .eq("brand_id", currentBrandId)
        .eq("context", context);
      return data || [];
    },
    enabled: !!currentBrandId,
  });

  const allDefaults = {
    ...buildDefaultsMap(BRAND_SIDEBAR_GROUPS),
    ...buildDefaultsMap(BRANCH_SIDEBAR_GROUPS),
    ...buildDefaultsMap(APP_GROUPS),
  };

  const getLabel = (key: string): string => {
    const custom = customLabels?.find((l) => l.key === key);
    if (custom) return custom.custom_label;
    return allDefaults[key] || key;
  };

  return { getLabel, allDefaults, customLabels };
}
