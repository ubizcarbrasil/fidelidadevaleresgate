/**
 * Hook para gerenciar palpites sociais em duelos.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { toast } from "sonner";

interface ResumoPalpites {
  participant_id: string;
  guess_count: number;
}

export function usePalpitesDuelo(duelId: string | undefined) {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  // Resumo dos palpites (contagem por lado)
  const { data: resumo, isLoading: isLoadingResumo } = useQuery({
    queryKey: ["duel-guesses-summary", duelId],
    queryFn: async () => {
      if (!duelId) return [];
      const { data, error } = await supabase.rpc("get_duel_guesses_summary", {
        p_duel_id: duelId,
      });
      if (error) throw error;
      return (data as ResumoPalpites[]) || [];
    },
    enabled: !!duelId,
    refetchInterval: 15000,
  });

  // Palpite do motorista atual
  const { data: meuPalpite } = useQuery({
    queryKey: ["duel-my-guess", duelId, driver?.id],
    queryFn: async () => {
      if (!duelId || !driver?.id) return null;
      const { data, error } = await supabase
        .from("driver_duel_guesses")
        .select("predicted_winner_participant_id")
        .eq("duel_id", duelId)
        .eq("customer_id", driver.id)
        .maybeSingle();
      if (error) throw error;
      return data?.predicted_winner_participant_id ?? null;
    },
    enabled: !!duelId && !!driver?.id,
  });

  // Mutation para registrar palpite
  const { mutate: registrarPalpite, isPending } = useMutation({
    mutationFn: async (participantId: string) => {
      if (!duelId || !driver?.id) throw new Error("Sem sessão");
      const { error } = await supabase.from("driver_duel_guesses").upsert(
        {
          duel_id: duelId,
          customer_id: driver.id,
          predicted_winner_participant_id: participantId,
        },
        { onConflict: "duel_id,customer_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duel-guesses-summary", duelId] });
      queryClient.invalidateQueries({ queryKey: ["duel-my-guess", duelId] });
      toast.success("Palpite registrado! 🎯");
    },
    onError: () => toast.error("Erro ao registrar palpite"),
  });

  // Calcular totais e percentuais
  const totalPalpites = resumo?.reduce((s, r) => s + r.guess_count, 0) || 0;

  function getContagem(participantId: string): number {
    return resumo?.find((r) => r.participant_id === participantId)?.guess_count || 0;
  }

  function getPercentual(participantId: string): number {
    if (totalPalpites === 0) return 0;
    return Math.round((getContagem(participantId) / totalPalpites) * 100);
  }

  return {
    resumo,
    meuPalpite,
    totalPalpites,
    getContagem,
    getPercentual,
    registrarPalpite,
    isPending,
    isLoadingResumo,
  };
}
