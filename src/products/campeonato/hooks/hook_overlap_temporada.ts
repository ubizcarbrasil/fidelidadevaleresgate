import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemporadaSobreposta {
  id: string;
  name: string;
  classification_starts_at: string;
  knockout_ends_at: string;
}

/**
 * Verifica se já existe alguma temporada NÃO cancelada na mesma cidade
 * cujo intervalo (classificação → fim do mata-mata) se sobreponha ao
 * intervalo informado [startISO, endISO].
 *
 * Regra de sobreposição: existing.start <= newEnd AND existing.end >= newStart.
 */
export function useCheckSeasonOverlap(
  brandId: string | undefined,
  branchId: string | undefined,
  startISO: string | null | undefined,
  endISO: string | null | undefined,
) {
  return useQuery({
    queryKey: ["check-season-overlap", brandId, branchId, startISO, endISO],
    enabled: !!brandId && !!branchId && !!startISO && !!endISO,
    queryFn: async (): Promise<TemporadaSobreposta | null> => {
      // Filtro adicional .not("knockout_ends_at", "is", null) — auditoria
      // identificou que temporadas em classificação com knockout_ends_at
      // NULL faziam o operador gte() retornar NULL silenciosamente,
      // permitindo criar temporadas que se sobrepõem com futuras.
      const { data, error } = await supabase
        .from("campeonato_seasons")
        .select("id, name, classification_starts_at, knockout_ends_at")
        .eq("brand_id", brandId!)
        .eq("branch_id", branchId!)
        .is("cancelled_at", null)
        .not("knockout_ends_at", "is", null)
        .not("classification_starts_at", "is", null)
        .lte("classification_starts_at", endISO!)
        .gte("knockout_ends_at", startISO!)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as TemporadaSobreposta | null) ?? null;
    },
    staleTime: 10_000,
  });
}