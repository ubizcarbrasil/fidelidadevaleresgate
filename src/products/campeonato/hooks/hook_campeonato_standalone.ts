import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CAMPEONATO_STANDALONE_KEY } from "../constants/constantes_campeonato";

/**
 * Lê `brands.brand_settings_json.campeonato_standalone_enabled`.
 * Default `false` quando o campo está ausente ou `brandId` é nulo.
 */
export function useCampeonatoStandalone(brandId: string | null | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ["campeonato-standalone", brandId ?? null],
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!brandId) return false;
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .maybeSingle();
      if (error) throw error;
      const settings =
        (data?.brand_settings_json as Record<string, unknown> | null) ?? null;
      return settings?.[CAMPEONATO_STANDALONE_KEY] === true;
    },
  });

  return { standalone: data ?? false, isLoading };
}

export function useInvalidarCampeonatoStandalone() {
  const qc = useQueryClient();
  return (brandId: string | null | undefined) =>
    qc.invalidateQueries({ queryKey: ["campeonato-standalone", brandId ?? null] });
}