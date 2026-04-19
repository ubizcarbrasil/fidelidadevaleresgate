/**
 * hook_business_models_ui_flag — Sub-fase 5.5
 * --------------------------------------------
 * Decide se a brand deve ver a UI nova de "Modelos de Negócio".
 *
 * Regra: ativa se OU
 *   - flag global `USE_BUSINESS_MODELS` = true (rollout total), OU
 *   - `brands.brand_settings_json.business_models_ui_enabled === true` (opt-in beta)
 *
 * Mantemos o opt-in granular por marca para destravar gradualmente o beta.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { USE_BUSINESS_MODELS } from "@/compartilhados/constants/constantes_features";

export function useBusinessModelsUiEnabled(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ["business-models-ui-enabled", brandId] as const,
    enabled: !!brandId,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      if (USE_BUSINESS_MODELS) return true;
      if (!brandId) return false;

      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .maybeSingle();
      if (error) throw error;

      const settings = (data?.brand_settings_json ?? {}) as Record<string, unknown>;
      return settings["business_models_ui_enabled"] === true;
    },
  });
}
