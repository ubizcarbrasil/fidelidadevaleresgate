import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const DEFAULT_LABELS: Record<string, Record<string, string>> = {
  admin: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.tema_marca": "Tema & Marca",
    "sidebar.dominios": "Domínios",
    "sidebar.galeria_icones": "Galeria de Ícones",
    "sidebar.secoes_home": "Seções da Home",
    "sidebar.central_banners": "Central de Banners",
    "sidebar.nomes_rotulos": "Nomes e Rótulos",
    "sidebar.lojas": "Lojas",
    "sidebar.branches": "Branches",
    "sidebar.aprovacao_lojas": "Aprovação de Lojas",
    "sidebar.importar_csv": "Importar CSV",
    "sidebar.regras_pontos": "Regras de Pontos",
    "sidebar.extrato_pontos": "Extrato de Pontos",
    "sidebar.usuarios": "Usuários",
    "sidebar.modulos": "Módulos",
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
