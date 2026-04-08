import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type MessageFlow = {
  id: string;
  brand_id: string;
  branch_id: string | null;
  event_type: string;
  template_id: string;
  audience: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MessageLog = {
  id: string;
  brand_id: string;
  branch_id: string | null;
  flow_id: string | null;
  template_id: string | null;
  customer_id: string;
  event_type: string | null;
  rendered_message: string;
  status: string;
  error_detail: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

const FLOWS_KEY = "driver-message-flows";
const LOGS_KEY = "driver-message-logs";

export const EVENT_TYPES = [
  { value: "DUEL_CHALLENGE_RECEIVED", label: "Desafio de duelo recebido", category: "duel" },
  { value: "DUEL_ACCEPTED", label: "Duelo aceito", category: "duel" },
  { value: "DUEL_DECLINED", label: "Duelo recusado", category: "duel" },
  { value: "DUEL_STARTED", label: "Duelo iniciou", category: "duel" },
  { value: "DUEL_FINISHED", label: "Duelo finalizado", category: "duel" },
  { value: "DUEL_VICTORY", label: "Vitória no duelo", category: "duel" },
  { value: "BELT_NEW_CHAMPION", label: "Novo campeão do cinturão", category: "belt" },
  { value: "PROMOTION_NEW", label: "Nova promoção disponível", category: "promotion" },
] as const;

export const AUDIENCE_OPTIONS = [
  { value: "all_drivers", label: "Todos os motoristas" },
  { value: "participants", label: "Participantes do evento" },
  { value: "winner", label: "Vencedor" },
  { value: "loser", label: "Perdedor" },
  { value: "challenger", label: "Desafiante" },
  { value: "challenged", label: "Desafiado" },
  { value: "individual", label: "Individual (específico)" },
] as const;

export const AVAILABLE_VARS = [
  { key: "nome", label: "Nome do motorista", example: "João Silva" },
  { key: "pontos", label: "Pontos do contexto", example: "150" },
  { key: "saldo", label: "Saldo atual", example: "1.250" },
  { key: "adversario", label: "Nome do adversário", example: "Carlos Lima" },
  { key: "corridas", label: "Contagem de corridas", example: "42" },
  { key: "premio", label: "Valor do prêmio", example: "500" },
  { key: "cidade", label: "Nome da cidade", example: "São Paulo" },
] as const;

export function useMessageFlows(brandId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [FLOWS_KEY, brandId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("driver_message_flows")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MessageFlow[];
    },
    enabled: !!brandId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (flow: Partial<MessageFlow> & { brand_id: string }) => {
      if (flow.id) {
        const { id, created_at, updated_at, ...rest } = flow as any;
        const { error } = await (supabase as any)
          .from("driver_message_flows")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("driver_message_flows")
          .insert(flow);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FLOWS_KEY, brandId] });
      toast({ title: "Fluxo salvo com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar fluxo", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (flowId: string) => {
      const { error } = await (supabase as any)
        .from("driver_message_flows")
        .delete()
        .eq("id", flowId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FLOWS_KEY, brandId] });
      toast({ title: "Fluxo removido" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover fluxo", description: err.message, variant: "destructive" });
    },
  });

  return {
    flows: query.data ?? [],
    isLoading: query.isLoading,
    upsertFlow: upsertMutation.mutateAsync,
    deleteFlow: deleteMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}

export function useMessageLogs(brandId: string | null, limit = 50) {
  return useQuery({
    queryKey: [LOGS_KEY, brandId, limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("driver_message_logs")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as MessageLog[];
    },
    enabled: !!brandId,
  });
}
