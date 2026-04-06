/**
 * Hook para buscar duelos públicos da cidade (visível para todos os motoristas).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Duel } from "./hook_duelos";

export function useDuelosCidade(branchId: string | undefined) {
  return useQuery({
    queryKey: ["duelos-cidade", branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("driver_duels")
        .select(
          "*, challenger:driver_duel_participants!driver_duels_challenger_id_fkey(*, customers(name, cpf)), challenged:driver_duel_participants!driver_duels_challenged_id_fkey(*, customers(name, cpf))"
        )
        .eq("branch_id", branchId)
        .in("status", ["live", "accepted", "pending", "finished"])
        .gte("created_at", seteDiasAtras)
        .order("status", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Ordenar: live primeiro, depois accepted/pending, depois finished
      const ordemStatus: Record<string, number> = {
        live: 0,
        accepted: 1,
        pending: 2,
        finished: 3,
      };

      return ((data || []) as Duel[]).sort(
        (a, b) => (ordemStatus[a.status] ?? 9) - (ordemStatus[b.status] ?? 9)
      );
    },
    enabled: !!branchId,
    refetchInterval: 30_000,
  });
}
