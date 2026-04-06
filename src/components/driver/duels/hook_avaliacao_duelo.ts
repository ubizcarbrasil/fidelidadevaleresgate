/**
 * Hook para avaliação mútua entre motoristas após duelo.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AvaliacaoDuelo {
  duel_id: string;
  rater_customer_id: string;
  rated_customer_id: string;
  rating: number;
  tags: string[];
  comment?: string;
}

export interface Reputacao {
  avg_rating: number;
  total_ratings: number;
  top_tags: Array<{ tag: string; count: number }>;
}

/** Verifica se o motorista já avaliou o adversário neste duelo */
export function useDuelRating(duelId: string | null, raterCustomerId: string | null) {
  return useQuery({
    queryKey: ["duel-rating", duelId, raterCustomerId],
    queryFn: async () => {
      if (!duelId || !raterCustomerId) return null;
      const { data, error } = await supabase
        .from("driver_duel_ratings")
        .select("*")
        .eq("duel_id", duelId)
        .eq("rater_customer_id", raterCustomerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!duelId && !!raterCustomerId,
  });
}

/** Envia avaliação */
export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AvaliacaoDuelo) => {
      const { error } = await supabase.from("driver_duel_ratings").insert({
        duel_id: params.duel_id,
        rater_customer_id: params.rater_customer_id,
        rated_customer_id: params.rated_customer_id,
        rating: params.rating,
        tags: params.tags,
        comment: params.comment || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["duel-rating", vars.duel_id] });
      queryClient.invalidateQueries({ queryKey: ["driver-reputation"] });
      toast.success("Avaliação enviada! ⭐");
    },
    onError: (err: any) => {
      const msg = err.message?.includes("unique_rating_per_duel")
        ? "Você já avaliou este adversário neste duelo"
        : err.message || "Erro ao enviar avaliação";
      toast.error(msg);
    },
  });
}

/** Busca reputação de um motorista */
export function useDriverReputation(customerId: string | null) {
  return useQuery({
    queryKey: ["driver-reputation", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase.rpc("get_driver_reputation", {
        p_customer_id: customerId,
      });
      if (error) throw error;
      return data as unknown as Reputacao;
    },
    enabled: !!customerId,
  });
}

/** Tags permitidas para avaliação */
export const TAGS_AVALIACAO = [
  "competitivo",
  "respeitoso",
  "bom adversário",
  "foi pra cima",
  "pediu revanche",
  "pontual",
] as const;
