/**
 * Hook para gerenciar apostas laterais (side bets) em duelos.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { toast } from "sonner";

export interface SideBet {
  id: string;
  duel_id: string;
  branch_id: string;
  brand_id: string;
  bettor_a_customer_id: string;
  bettor_a_predicted_winner: string;
  bettor_a_points: number;
  bettor_b_customer_id: string | null;
  bettor_b_predicted_winner: string | null;
  bettor_b_points: number | null;
  status: string;
  counter_proposal_points: number | null;
  points_reserved: boolean;
  winner_customer_id: string | null;
  duel_winner_bonus: number;
  settled_at: string | null;
  created_at: string;
  // Joined
  bettor_a_name?: string;
  bettor_b_name?: string;
}

export function useSideBets(duelId: string) {
  return useQuery({
    queryKey: ["side-bets", duelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duel_side_bets" as any)
        .select("*")
        .eq("duel_id", duelId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SideBet[];
    },
    refetchInterval: 10000,
  });
}

export function useCreateSideBet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      duelId: string;
      customerId: string;
      predictedWinnerParticipantId: string;
      points: number;
    }) => {
      const { data, error } = await supabase.rpc("create_side_bet" as any, {
        p_duel_id: params.duelId,
        p_customer_id: params.customerId,
        p_predicted_winner_participant_id: params.predictedWinnerParticipantId,
        p_points: params.points,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao criar aposta");
      return result;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["side-bets", vars.duelId] });
      toast.success("Aposta criada! Aguardando um oponente.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar aposta");
    },
  });
}

export function useAcceptSideBet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { betId: string; customerId: string; duelId: string }) => {
      const { data, error } = await supabase.rpc("accept_side_bet" as any, {
        p_bet_id: params.betId,
        p_customer_id: params.customerId,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao aceitar aposta");
      return result;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["side-bets", vars.duelId] });
      qc.invalidateQueries({ queryKey: ["driver-session"] });
      toast.success("Aposta aceita! Pontos reservados.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao aceitar aposta");
    },
  });
}

export function useCounterProposeSideBet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      betId: string;
      customerId: string;
      counterPoints: number;
      duelId: string;
    }) => {
      const { data, error } = await supabase.rpc("counter_propose_side_bet" as any, {
        p_bet_id: params.betId,
        p_customer_id: params.customerId,
        p_counter_points: params.counterPoints,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro na contraproposta");
      return result;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["side-bets", vars.duelId] });
      toast.success("Contraproposta enviada!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro na contraproposta");
    },
  });
}

export function useRespondSideBetCounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      betId: string;
      customerId: string;
      accept: boolean;
      duelId: string;
    }) => {
      const { data, error } = await supabase.rpc("respond_side_bet_counter" as any, {
        p_bet_id: params.betId,
        p_customer_id: params.customerId,
        p_accept: params.accept,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao responder contraproposta");
      return result;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["side-bets", vars.duelId] });
      qc.invalidateQueries({ queryKey: ["driver-session"] });
      toast.success(vars.accept ? "Contraproposta aceita! Pontos reservados." : "Contraproposta recusada.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao responder");
    },
  });
}
