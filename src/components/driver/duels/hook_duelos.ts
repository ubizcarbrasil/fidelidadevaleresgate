/**
 * Hook para gerenciar dados e ações do módulo de duelos.
 */
import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { toast } from "sonner";
import { eventBus } from "@/lib/eventBus";
import { enviarNotificacaoDuelo } from "./servico_notificacoes_duelo";

export interface DuelParticipant {
  id: string;
  customer_id: string;
  branch_id: string;
  brand_id: string;
  duels_enabled: boolean;
  public_nickname: string | null;
  avatar_url: string | null;
  display_name: string | null;
  customers?: { name: string; cpf: string | null } | null;
}

export interface Duel {
  id: string;
  branch_id: string;
  brand_id: string;
  challenger_id: string;
  challenged_id: string;
  start_at: string;
  end_at: string;
  status: string;
  challenger_rides_count: number;
  challenged_rides_count: number;
  winner_id: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  finished_at: string | null;
  created_at: string;
  challenger_points_bet: number;
  challenged_points_bet: number;
  negotiation_status: string;
  counter_proposal_points: number | null;
  counter_proposal_by: string | null;
  points_reserved: boolean;
  points_settled: boolean;
  challenger?: DuelParticipant;
  challenged?: DuelParticipant;
}

export function useDuelParticipation() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  const { data: participant, isLoading } = useQuery({
    queryKey: ["duel-participant", driver?.id],
    queryFn: async () => {
      if (!driver) return null;
      const { data, error } = await supabase
        .from("driver_duel_participants")
        .select("*")
        .eq("customer_id", driver.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!driver,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!driver) throw new Error("Sem sessão");
      const { data, error } = await supabase.rpc("toggle_duel_participation", {
        p_customer_id: driver.id,
        p_branch_id: driver.branch_id,
        p_brand_id: driver.brand_id,
        p_enabled: enabled,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao alterar participação");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duel-participant"] });
      toast.success("Participação atualizada!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao alterar participação"),
  });

  // Auto-enroll: se motorista não tem registro, criar automaticamente com duels_enabled=true
  const autoEnrolled = useRef(false);
  useEffect(() => {
    if (!isLoading && !participant && driver && !autoEnrolled.current) {
      autoEnrolled.current = true;
      supabase.rpc("toggle_duel_participation", {
        p_customer_id: driver.id,
        p_branch_id: driver.branch_id,
        p_brand_id: driver.brand_id,
        p_enabled: true,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["duel-participant"] });
      });
    }
  }, [isLoading, participant, driver, queryClient]);

  return { participant, isLoading, toggleParticipation: toggleMutation.mutate, toggling: toggleMutation.isPending };
}

export function useDuelOpponents() {
  const { driver } = useDriverSession();

  return useQuery({
    queryKey: ["duel-opponents", driver?.branch_id],
    queryFn: async () => {
      if (!driver) return [];
      const { data, error } = await supabase
        .from("driver_duel_participants")
        .select("id, customer_id, branch_id, brand_id, duels_enabled, public_nickname, avatar_url, display_name")
        .eq("branch_id", driver.branch_id)
        .eq("duels_enabled", true)
        .neq("customer_id", driver.id);
      if (error) throw error;
      return (data || []) as DuelParticipant[];
    },
    enabled: !!driver,
  });
}

export function useUpdateNickname() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nickname: string | null) => {
      if (!driver) throw new Error("Sem sessão");
      const { data: part } = await supabase
        .from("driver_duel_participants")
        .select("id")
        .eq("customer_id", driver.id)
        .maybeSingle();
      if (!part) throw new Error("Participante não encontrado");
      const { error } = await supabase
        .from("driver_duel_participants")
        .update({ public_nickname: nickname })
        .eq("id", part.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duel-participant"] });
      queryClient.invalidateQueries({ queryKey: ["duel-opponents"] });
      toast.success("Apelido atualizado! 🎯");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar apelido"),
  });
}

export function useDriverDuels() {
  const { driver } = useDriverSession();

  return useQuery({
    queryKey: ["driver-duels", driver?.id],
    queryFn: async () => {
      if (!driver) return [];
      const { data: part } = await supabase
        .from("driver_duel_participants")
        .select("id")
        .eq("customer_id", driver.id)
        .maybeSingle();
      if (!part) return [];

      const { data, error } = await supabase
        .from("driver_duels")
        .select("*, challenger:driver_duel_participants!driver_duels_challenger_id_fkey(*, customers(name, cpf)), challenged:driver_duel_participants!driver_duels_challenged_id_fkey(*, customers(name, cpf))")
        .or(`challenger_id.eq.${part.id},challenged_id.eq.${part.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Duel[];
    },
    enabled: !!driver,
  });
}

export function useCreateDuel() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { challengedCustomerId: string; startAt: string; endAt: string; pointsBet?: number }) => {
      if (!driver) throw new Error("Sem sessão");
      const { data, error } = await supabase.rpc("create_duel_challenge", {
        p_challenger_customer_id: driver.id,
        p_challenged_customer_id: params.challengedCustomerId,
        p_branch_id: driver.branch_id,
        p_brand_id: driver.brand_id,
        p_start_at: params.startAt,
        p_end_at: params.endAt,
        p_points_bet: params.pointsBet || 0,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao criar desafio");
      return { ...result, challengedCustomerId: params.challengedCustomerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      toast.success("Desafio enviado! 🥊");

      const driverName = cleanDriverName(driver?.name);
      const duelId = result.duel_id;

      eventBus.emit("DUEL_CHALLENGE_RECEIVED", {
        brandId: driver!.brand_id,
        challengedCustomerId: result.challengedCustomerId,
        challengerName: driverName,
        duelId,
      });

      enviarNotificacaoDuelo({
        tipo: "DUEL_CHALLENGE_RECEIVED",
        customerIds: [result.challengedCustomerId],
        duelId,
        nomeOponente: driverName,
      });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar desafio"),
  });
}

export function useRespondDuel() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { duelId: string; accept: boolean; challengerCustomerId?: string; challengerName?: string }) => {
      if (!driver) throw new Error("Sem sessão");
      const { data, error } = await supabase.rpc("respond_to_duel", {
        p_duel_id: params.duelId,
        p_customer_id: driver.id,
        p_accept: params.accept,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao responder desafio");
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      queryClient.invalidateQueries({ queryKey: ["driver-session"] });
      toast.success(vars.accept ? "Desafio aceito! 💪" : "Você arregou... 😅");

      const driverName = cleanDriverName(driver?.name);

      if (vars.accept) {
        eventBus.emit("DUEL_CHALLENGE_ACCEPTED", {
          brandId: driver!.brand_id,
          challengerCustomerId: vars.challengerCustomerId || "",
          challengedName: driverName,
          duelId: vars.duelId,
        });
        if (vars.challengerCustomerId) {
          enviarNotificacaoDuelo({
            tipo: "DUEL_CHALLENGE_ACCEPTED",
            customerIds: [vars.challengerCustomerId],
            duelId: vars.duelId,
            nomeOponente: driverName,
          });
        }
      } else {
        eventBus.emit("DUEL_CHALLENGE_DECLINED", {
          brandId: driver!.brand_id,
          challengerCustomerId: vars.challengerCustomerId || "",
          challengedName: driverName,
          duelId: vars.duelId,
        });
        if (vars.challengerCustomerId) {
          enviarNotificacaoDuelo({
            tipo: "DUEL_CHALLENGE_DECLINED",
            customerIds: [vars.challengerCustomerId],
            duelId: vars.duelId,
            nomeOponente: driverName,
          });
        }
      }
    },
    onError: (err: any) => toast.error(err.message || "Erro ao responder"),
  });
}

export function useCounterPropose() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { duelId: string; counterPoints: number; opponentCustomerId?: string }) => {
      if (!driver) throw new Error("Sem sessão");
      const { data, error } = await supabase.rpc("counter_propose_duel", {
        p_duel_id: params.duelId,
        p_customer_id: driver.id,
        p_counter_points: params.counterPoints,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao enviar contraproposta");
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      toast.success("Contraproposta enviada! 💬");

      if (vars.opponentCustomerId) {
        enviarNotificacaoDuelo({
          tipo: "DUEL_COUNTER_PROPOSAL",
          customerIds: [vars.opponentCustomerId],
          duelId: vars.duelId,
          nomeOponente: cleanDriverName(driver?.name),
        });
      }
    },
    onError: (err: any) => toast.error(err.message || "Erro ao enviar contraproposta"),
  });
}

export function useRespondCounterProposal() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { duelId: string; accept: boolean; opponentCustomerId?: string }) => {
      if (!driver) throw new Error("Sem sessão");
      const { data, error } = await supabase.rpc("respond_counter_proposal", {
        p_duel_id: params.duelId,
        p_customer_id: driver.id,
        p_accept: params.accept,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao responder contraproposta");
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      queryClient.invalidateQueries({ queryKey: ["driver-session"] });
      toast.success(vars.accept ? "Contraproposta aceita! Pontos reservados 🔒" : "Negociação encerrada");

      if (vars.opponentCustomerId) {
        enviarNotificacaoDuelo({
          tipo: vars.accept ? "DUEL_CHALLENGE_ACCEPTED" : "DUEL_CHALLENGE_DECLINED",
          customerIds: [vars.opponentCustomerId],
          duelId: vars.duelId,
          nomeOponente: cleanDriverName(driver?.name),
        });
      }
    },
    onError: (err: any) => toast.error(err.message || "Erro ao responder contraproposta"),
  });
}

export function useFinalizeDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      duelId: string;
      brandId: string;
      challengerCustomerId: string;
      challengedCustomerId: string;
      challengerParticipantId: string;
      challengedParticipantId: string;
      challengerName: string;
      challengedName: string;
    }) => {
      const { data, error } = await supabase.rpc("finalize_duel", { p_duel_id: params.duelId });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao finalizar duelo");
      return { ...result, ...params };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      queryClient.invalidateQueries({ queryKey: ["driver-session"] });
      toast.success("Duelo finalizado! 🏆");

      const bothIds = [result.challengerCustomerId, result.challengedCustomerId];

      eventBus.emit("DUEL_FINISHED", {
        brandId: result.brandId,
        customerIds: bothIds,
        duelId: result.duelId,
        winnerId: result.winner_id,
      });

      enviarNotificacaoDuelo({
        tipo: "DUEL_FINISHED",
        customerIds: bothIds,
        duelId: result.duelId,
      });

      if (result.winner_id) {
        const isChallenger = result.winner_id === result.challengerParticipantId;
        const winnerCustomerId = isChallenger ? result.challengerCustomerId : result.challengedCustomerId;
        const loserCustomerId = isChallenger ? result.challengedCustomerId : result.challengerCustomerId;
        const winnerName = isChallenger ? result.challengerName : result.challengedName;
        const loserName = isChallenger ? result.challengedName : result.challengerName;

        enviarNotificacaoDuelo({
          tipo: "DUEL_VICTORY",
          customerIds: [winnerCustomerId],
          duelId: result.duelId,
          nomeOponente: loserName,
        });

        enviarNotificacaoDuelo({
          tipo: "DUEL_DEFEAT",
          customerIds: [loserCustomerId],
          duelId: result.duelId,
          nomeOponente: winnerName,
        });
      }
    },
    onError: (err: any) => toast.error(err.message || "Erro ao finalizar"),
  });
}

/** Helper: nome limpo do motorista */
export function cleanDriverName(name?: string | null): string {
  if (!name) return "Motorista";
  return name.replace(/\[MOTORISTA\]\s*/gi, "").trim() || "Motorista";
}

export interface CompetitiveProfile {
  total_duels: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  points_won: number;
  points_lost: number;
  recent: Array<{
    id: string;
    finished_at: string;
    result: "win" | "loss" | "draw";
    opponent_name: string;
    challenger_points_bet: number;
    challenged_points_bet: number;
    challenger_rides_count: number;
    challenged_rides_count: number;
  }>;
}

export function useDriverCompetitiveProfile(customerId: string | null) {
  return useQuery({
    queryKey: ["driver-competitive-profile", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase.rpc("get_driver_competitive_profile", {
        p_customer_id: customerId,
      });
      if (error) throw error;
      return data as unknown as CompetitiveProfile;
    },
    enabled: !!customerId,
  });
}
