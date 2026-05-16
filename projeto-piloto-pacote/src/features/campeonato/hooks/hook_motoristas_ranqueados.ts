import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MotoristaRanqueado {
  rank_position: number;
  customer_id: string;
  driver_name: string | null;
  phone: string | null;
  rides_count: number;
  points_balance: number;
  is_active: boolean;
}

export function useMotoristasRanqueados(branchId: string, sinceDays = 30) {
  return useQuery({
    queryKey: ["motoristas-ranqueados", branchId, sinceDays],
    enabled: !!branchId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_drivers_ranking_for_season" as any,
        { p_branch_id: branchId, p_since_days: sinceDays },
      );
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        rank_position: Number(r.rank_position),
        customer_id: String(r.customer_id),
        driver_name: r.driver_name,
        phone: r.phone,
        rides_count: Number(r.rides_count),
        points_balance: Number(r.points_balance),
        is_active: !!r.is_active,
      })) as MotoristaRanqueado[];
    },
  });
}