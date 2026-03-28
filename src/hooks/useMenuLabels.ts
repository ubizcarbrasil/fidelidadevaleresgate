import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const DEFAULT_LABELS: Record<string, Record<string, string>> = {
  admin: {
    "sidebar.dashboard": "Visão Geral",
    "sidebar.jornada": "Guia do Empreendedor",
    "sidebar.jornada_emissor": "Guia do Emissor",
    "sidebar.tema_marca": "Aparência da Marca",
    "sidebar.dominios": "Domínios",
    "sidebar.galeria_icones": "Biblioteca de Ícones",
    "sidebar.secoes_home": "Seções Iniciais",
    "sidebar.central_banners": "Mídia & Banners",
    "sidebar.nomes_rotulos": "Nomenclaturas",
    "sidebar.page_builder": "Editor de Páginas",
    "sidebar.partner_landing": "Landing Page Parceiros",
    "sidebar.welcome_tour": "Boas-Vindas",
    "sidebar.profile_links": "Links do Perfil",
    "sidebar.branches": "Cidades",
    "sidebar.parceiros": "Parceiros",
    "sidebar.ofertas": "Ofertas",
    "sidebar.clientes": "Clientes",
    "sidebar.resgates": "Resgates",
    "sidebar.cupons": "Cupons",
    "sidebar.aprovacao_lojas": "Aprovar Parceiros",
    "sidebar.aprovar_regras": "Validar Regras",
    "sidebar.solicitacoes_emissor": "Solicitações de Upgrade",
    "sidebar.importar_csv": "Importação de Dados",
    "sidebar.achadinhos": "Achadinhos",
    "sidebar.categorias_achadinhos": "Categorias de Achadinhos",
    "sidebar.catalogo": "Catálogo",
    "sidebar.enviar_notificacao": "Enviar Notificação",
    "sidebar.operador_pdv": "Caixa PDV",
    "sidebar.pontuar": "Pontuar",
    "sidebar.regras_pontos": "Regras de Fidelidade",
    "sidebar.regra_parceiro": "Regra de Pontos do Parceiro",
    "sidebar.tier_pontos": "Pontuação por Tier",
    "sidebar.extrato_pontos": "Extrato de Fidelidade",
    "sidebar.gg_config": "Config. Cashback",
    "sidebar.gg_billing": "Financeiro Cashback",
    "sidebar.gg_closing": "Fechamento Financeiro",
    "sidebar.usuarios": "Usuários",
    "sidebar.modulos": "Módulos",
    "sidebar.perm_parceiros": "Permissão de Parceiros",
    "sidebar.auditoria": "Auditoria",
    "sidebar.relatorios": "Relatórios",
    "sidebar.taxonomia": "Taxonomia",
    "sidebar.patrocinados": "Patrocinados",
    "sidebar.api_keys": "APIs & Integrações",
    "sidebar.api_docs": "Documentação API",
    "sidebar.machine": "Integração Mobilidade",
    "sidebar.machine_test": "Lab Webhook",
    "sidebar.offer_card_config": "Layout de Ofertas",
    "sidebar.configuracoes": "Configurações",
    "sidebar.central_acessos": "Gestão de Acessos",
    "sidebar.crm": "Inteligência CRM",
    "sidebar.crm_contacts": "Contatos",
    "sidebar.crm_customers": "Clientes CRM",
    "sidebar.crm_tiers": "Tiers",
    "sidebar.crm_opportunities": "Oportunidades",
    "sidebar.crm_pareto": "Análise Pareto",
    "sidebar.crm_journey": "Jornada CRM",
    "sidebar.crm_audiences": "Públicos",
    "sidebar.crm_campaigns": "Campanhas",
    "sidebar.crm_analytics": "Analytics",
    "sidebar.crm_lost": "Clientes Perdidos",
    "sidebar.crm_potential": "Clientes Potenciais",
    "sidebar.painel_motorista": "Painel do Motorista",
    "sidebar.espelhamento": "Espelhamento Achadinho",
    "sidebar.governanca_ofertas": "Governança Achadinho",
    "sidebar.motoristas": "Motorista",
    "sidebar.driver_points_rules": "Regras de Pontuação Motorista",
  },
  customer_app: {
    "app.ofertas": "Ofertas",
    "app.cupons": "Cupons",
    "app.lojas": "Lojas",
    "app.pontos": "Pontos",
    "app.carteira": "Carteira",
    "app.perfil": "Perfil",
    "app.favoritos": "Favoritos",
  },
};

export function useMenuLabels(context: "admin" | "customer_app") {
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

  const getLabel = (key: string): string => {
    const custom = customLabels?.find((l) => l.key === key);
    if (custom) return custom.custom_label;
    return DEFAULT_LABELS[context]?.[key] || key;
  };

  const allDefaults = DEFAULT_LABELS[context] || {};

  return { getLabel, allDefaults, customLabels };
}
