import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PremioResumido {
  position: number;
  prize_kind: string | null;
  prize_value: string | number | null;
  description: string | null;
}

export interface ProximaTemporada {
  season_id: string;
  name: string;
  year: number;
  month: number;
  enrollment_opens_at: string | null;
  enrollment_closes_at: string | null;
  entry_fee_cents: number;
  entry_fee_currency: string | null;
  tiers_count: number;
  my_enrollment_status: "pending" | "approved" | "rejected" | null;
  prizes_summary: PremioResumido[];
}

/**
 * Lista temporadas futuras publicadas para a cidade do motorista,
 * incluindo o status atual da inscrição dele em cada uma.
 */
export function useProximosCampeonatos(
  branchId?: string | null,
  driverId?: string | null,
) {
  return useQuery({
    queryKey: ["campeonato-proximos", branchId, driverId],
    enabled: !!branchId && !!driverId,
    staleTime: 60_000,
    queryFn: async (): Promise<ProximaTemporada[]> => {
      const { data, error } = await (supabase as any).rpc(
        "driver_list_upcoming_seasons",
        { p_branch_id: branchId, p_driver_id: driverId },
      );
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        ...row,
        prizes_summary: Array.isArray(row.prizes_summary) ? row.prizes_summary : [],
      })) as ProximaTemporada[];
    },
  });
}