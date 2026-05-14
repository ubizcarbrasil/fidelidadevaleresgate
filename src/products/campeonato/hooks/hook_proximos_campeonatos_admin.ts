import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemporadaFuturaAdmin {
  id: string;
  name: string;
  year: number;
  month: number;
  classification_starts_at: string;
  classification_ends_at: string;
  knockout_starts_at: string;
  knockout_ends_at: string;
  enrollment_opens_at: string | null;
  enrollment_closes_at: string | null;
  entry_fee_cents: number | null;
  entry_fee_currency: string | null;
  published_at: string | null;
  cancelled_at: string | null;
  paused_at: string | null;
  branch_id: string;
  brand_id: string;
  tiers_count: number | null;
}

/**
 * Lista temporadas futuras (classificação ainda não iniciada) por
 * brand+branch. Inclui tanto publicadas quanto não publicadas para que
 * o admin possa programá-las antes de torná-las visíveis aos motoristas.
 */
export function useProximosCampeonatosAdmin(
  brandId?: string | null,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: ["empreendedor-proximos-campeonatos", brandId, branchId],
    enabled: !!brandId && !!branchId,
    staleTime: 30_000,
    queryFn: async (): Promise<TemporadaFuturaAdmin[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("campeonato_seasons")
        .select(
          "id, name, year, month, classification_starts_at, classification_ends_at, knockout_starts_at, knockout_ends_at, enrollment_opens_at, enrollment_closes_at, entry_fee_cents, entry_fee_currency, published_at, cancelled_at, paused_at, branch_id, brand_id, tiers_count",
        )
        .eq("brand_id", brandId!)
        .eq("branch_id", branchId!)
        .is("cancelled_at", null)
        .gt("classification_starts_at", nowIso)
        .order("classification_starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TemporadaFuturaAdmin[];
    },
  });
}