import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ResetHistoricoItem } from "../types/tipos_configuracao_duelo";

export function useHistoricoResets(branchId: string, limit = 10) {
  return useQuery({
    queryKey: ["duelo-reset-history", branchId, limit],
    enabled: !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duel_cycle_reset_history")
        .select("*")
        .eq("branch_id", branchId)
        .order("executed_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as ResetHistoricoItem[];
    },
  });
}