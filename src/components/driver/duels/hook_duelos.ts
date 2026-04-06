/**
 * Hook para gerenciar dados e ações do módulo de duelos.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { toast } from "sonner";

export interface DuelParticipant {
  id: string;
  customer_id: string;
  branch_id: string;
  brand_id: string;
  duels_enabled: boolean;
  public_nickname: string | null;
  avatar_url: string | null;
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
        .select("*, customers(name, cpf)")
        .eq("branch_id", driver.branch_id)
        .eq("duels_enabled", true)
        .neq("customer_id", driver.id);
      if (error) throw error;
      return (data || []) as DuelParticipant[];
    },
    enabled: !!driver,
  });
}

export function useDriverDuels() {
  const { driver } = useDriverSession();

  return useQuery({
    queryKey: ["driver-duels", driver?.id],
    queryFn: async () => {
      if (!driver) return [];
      // Get participant id first
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
    mutationFn: async (params: { challengedCustomerId: string; startAt: string; endAt: string }) => {
      if (!driver) throw new Error("Sem sessão");
      const { data, error } = await supabase.rpc("create_duel_challenge", {
        p_challenger_customer_id: driver.id,
        p_challenged_customer_id: params.challengedCustomerId,
        p_branch_id: driver.branch_id,
        p_brand_id: driver.brand_id,
        p_start_at: params.startAt,
        p_end_at: params.endAt,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao criar desafio");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      toast.success("Desafio enviado! 🥊");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar desafio"),
  });
}

export function useRespondDuel() {
  const { driver } = useDriverSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { duelId: string; accept: boolean }) => {
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
      toast.success(vars.accept ? "Desafio aceito! 💪" : "Você arregou... 😅");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao responder"),
  });
}

export function useFinalizeDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (duelId: string) => {
      const { data, error } = await supabase.rpc("finalize_duel", { p_duel_id: duelId });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao finalizar duelo");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-duels"] });
      toast.success("Duelo finalizado! 🏆");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao finalizar"),
  });
}

/** Helper: nome limpo do motorista */
export function cleanDriverName(name?: string | null): string {
  if (!name) return "Motorista";
  return name.replace(/\[MOTORISTA\]\s*/gi, "").trim() || "Motorista";
}
