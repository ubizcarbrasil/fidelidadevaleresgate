/**
 * Hook para ranking dos apostadores mais lucrativos em apostas laterais.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingApostadorEntry {
  rankPosition: number;
  customerId: string;
  bettorName: string;
  totalBets: number;
  betsWon: number;
  betsLost: number;
  winRate: number;
  pointsWon: number;
  pointsLost: number;
  netPoints: number;
}

export function useRankingApostadores(branchId: string | undefined) {
  return useQuery({
    queryKey: ["ranking-apostadores", branchId],
    queryFn: async (): Promise<RankingApostadorEntry[]> => {
      if (!branchId) return [];

      const { data, error } = await supabase.rpc("get_side_bet_ranking" as any, {
        p_branch_id: branchId,
        p_limit: 15,
      });
      if (error) throw error;
      if (!data || !Array.isArray(data)) return [];

      return data.map((r: any) => ({
        rankPosition: Number(r.rank_position),
        customerId: r.customer_id,
        bettorName: r.bettor_name || "Apostador",
        totalBets: Number(r.total_bets),
        betsWon: Number(r.bets_won),
        betsLost: Number(r.bets_lost),
        winRate: Number(r.win_rate),
        pointsWon: Number(r.points_won),
        pointsLost: Number(r.points_lost),
        netPoints: Number(r.net_points),
      }));
    },
    enabled: !!branchId,
    refetchInterval: 60_000,
  });
}
