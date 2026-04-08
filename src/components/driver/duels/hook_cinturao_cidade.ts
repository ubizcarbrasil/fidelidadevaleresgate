/**
 * Hook para buscar dados do Cinturão da Cidade.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampeaoCinturao {
  id: string;
  branch_id: string;
  champion_customer_id: string;
  champion_name: string;
  champion_nickname: string | null;
  champion_avatar_url: string | null;
  record_value: number;
  record_type: "monthly" | "all_time";
  achieved_at: string;
  belt_prize_points: number;
  assigned_manually: boolean;
}

export function useCinturaoCidade(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["city-belt-champion", branchId],
    enabled: !!branchId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<CampeaoCinturao[]> => {
      const { data, error } = await supabase.rpc("get_city_belt_champion", {
        p_branch_id: branchId!,
      });
      if (error) throw error;
      return (data as unknown as CampeaoCinturao[]) || [];
    },
  });
}
