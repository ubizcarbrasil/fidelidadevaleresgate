import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  USE_DUELO_CAMPEONATO,
  USE_DUELO_SERIES_HIERARQUICAS,
} from "@/compartilhados/constants/constantes_features";

/**
 * Resolve se o Campeonato Duelo Motorista está habilitado para a marca.
 *
 * Regra (City Flag Resolution):
 * - Flag global `USE_DUELO_CAMPEONATO` precisa estar ON.
 * - `brand_settings_json.duelo_campeonato_enabled` precisa ser estritamente `true`.
 *
 * Também expõe se as Séries Hierárquicas estão ativas, combinando
 * `USE_DUELO_SERIES_HIERARQUICAS` com `brand_settings_json.duelo_series_enabled === true`.
 */
export function useDueloCampeonatoHabilitado(brandId?: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["duelo-campeonato-habilitado", brandId],
    enabled: !!brandId && USE_DUELO_CAMPEONATO,
    staleTime: 60_000,
    queryFn: async () => {
      if (!brandId) return { campeonato: false, series: false };
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .maybeSingle();
      if (error) throw error;

      const settings =
        (data?.brand_settings_json as Record<string, unknown> | null) ?? null;
      const campeonato = settings?.duelo_campeonato_enabled === true;
      const series =
        USE_DUELO_SERIES_HIERARQUICAS &&
        campeonato &&
        settings?.duelo_series_enabled === true;

      return { campeonato, series };
    },
  });

  return {
    campeonatoHabilitado: USE_DUELO_CAMPEONATO && (data?.campeonato ?? false),
    seriesHabilitadas: data?.series ?? false,
    isLoading,
  };
}