import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const DEFAULT_LABELS: Record<string, Record<string, string>> = {
  admin: {
    "sidebar.dashboard": "Painel Principal",
    "sidebar.jornada": "Jornada do Empreendedor",
    "sidebar.jornada_emissor": "Jornada do Emissor",
    "sidebar.tema_marca": "Aparência da Marca",
    "sidebar.dominios": "Domínios",
    "sidebar.galeria_icones": "Galeria de Ícones",
    "sidebar.app_icons": "Ícones do App",
    "sidebar.secoes_home": "Seções da Tela Inicial",
    "sidebar.central_banners": "Central de Propagandas",
    "sidebar.nomes_rotulos": "Nomes e Rótulos",
    "sidebar.page_builder": "Construtor de Páginas",
    "sidebar.branches": "Cidades",
    "sidebar.parceiros": "Parceiros",
    "sidebar.ofertas": "Ofertas",
    "sidebar.clientes": "Clientes",
    "sidebar.resgates": "Resgates",
    "sidebar.cupons": "Cupons",
    "sidebar.aprovacao_lojas": "Aprovação de Parceiros",
    "sidebar.aprovar_regras": "Aprovar Regras",
    "sidebar.solicitacoes_emissor": "Solicitações de Emissor",
    "sidebar.importar_csv": "Importar Planilha",
    "sidebar.achadinhos": "Achadinhos",
    "sidebar.catalogo": "Catálogo",
    "sidebar.enviar_notificacao": "Enviar Notificação",
    "sidebar.operador_pdv": "Operador PDV",
    "sidebar.pontuar": "Pontuar",
    "sidebar.regras_pontos": "Regras de Pontos",
    "sidebar.regra_parceiro": "Regra de Pontos do Parceiro",
    "sidebar.extrato_pontos": "Extrato de Pontos",
    "sidebar.gg_config": "Configuração GG",
    "sidebar.gg_billing": "Painel Financeiro GG",
    "sidebar.gg_closing": "Fechamento Mensal",
    "sidebar.usuarios": "Usuários",
    "sidebar.modulos": "Funcionalidades",
    "sidebar.perm_parceiros": "Permissões dos Parceiros",
    "sidebar.auditoria": "Auditoria",
    "sidebar.relatorios": "Relatórios",
    "sidebar.taxonomia": "Taxonomia",
    "sidebar.api_keys": "Integrações API",
    "sidebar.api_docs": "Documentação API",
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
