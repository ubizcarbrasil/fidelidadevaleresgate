/**
 * Hook para métricas agregadas de duelos e apostas da cidade (Branch Dashboard).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BranchDuelosStats {
  duelosAtivos: number;
  duelosFinalizadosMes: number;
  apostasAbertas: number;
  apostasMatched: number;
  pontosEmEscrow: number;
  bonusDistribuido: number;
}

export function useBranchDuelosStats(branchId: string) {
  return useQuery({
    queryKey: ["branch-duelos-stats", branchId],
    queryFn: async (): Promise<BranchDuelosStats> => {
      const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Parallel queries
      const [duelosAtivosRes, duelosFinRes, apostasAbertasRes, apostasMatchedRes, bonusRes] = await Promise.all([
        supabase
          .from("driver_duels")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .in("status", ["accepted", "live", "pending"]),
        supabase
          .from("driver_duels")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("status", "finished")
          .gte("finished_at", mesInicio),
        supabase
          .from("duel_side_bets")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("status", "open"),
        supabase
          .from("duel_side_bets")
          .select("bettor_a_points, bettor_b_points")
          .eq("branch_id", branchId)
          .eq("status", "matched")
          .eq("points_reserved", true),
        supabase
          .from("duel_side_bets")
          .select("duel_winner_bonus")
          .eq("branch_id", branchId)
          .eq("status", "settled")
          .gte("settled_at", mesInicio),
      ]);

      const pontosEmEscrow = (apostasMatchedRes.data || []).reduce(
        (acc, b) => acc + (b.bettor_a_points || 0) + (b.bettor_b_points || 0),
        0
      );

      const bonusDistribuido = (bonusRes.data || []).reduce(
        (acc, b) => acc + (b.duel_winner_bonus || 0),
        0
      );

      return {
        duelosAtivos: duelosAtivosRes.count || 0,
        duelosFinalizadosMes: duelosFinRes.count || 0,
        apostasAbertas: apostasAbertasRes.count || 0,
        apostasMatched: (apostasMatchedRes.data || []).length,
        pontosEmEscrow,
        bonusDistribuido,
      };
    },
    refetchInterval: 30_000,
  });
}
