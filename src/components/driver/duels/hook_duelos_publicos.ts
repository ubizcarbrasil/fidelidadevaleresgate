/**
 * Hook para buscar duelos públicos da cidade (visível para todos os motoristas).
 * Usa Realtime para atualização automática sem refresh.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Duel } from "./hook_duelos";

export function useDuelosCidade(branchId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["duelos-cidade", branchId];

  // Realtime subscription
  useEffect(() => {
    if (!branchId) return;

    const channel = supabase
      .channel(`duelos-cidade-${branchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_duels",
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, queryClient]);

  return useQuery({
    queryKey,
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
    refetchInterval: 60_000, // fallback mais longo, Realtime é primário
  });
}
