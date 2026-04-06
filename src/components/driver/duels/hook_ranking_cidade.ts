import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cleanDriverName } from "./hook_duelos";

export interface RankingEntry {
  rankPosition: number;
  customerId: string;
  driverName: string;
  totalRides: number;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface MinhaColocacao {
  rankPosition: number;
  totalRides: number;
}

export function useRankingCidade(branchId: string | undefined) {
  return useQuery({
    queryKey: ["ranking-cidade", branchId],
    queryFn: async (): Promise<RankingEntry[]> => {
      if (!branchId) return [];

      const { data, error } = await supabase.rpc("get_city_driver_ranking", {
        p_branch_id: branchId,
        p_limit: 10,
      });
      if (error) throw error;
      if (!data || !Array.isArray(data)) return [];

      // Fetch nicknames from duel participants
      const customerIds = data.map((r: any) => r.customer_id).filter(Boolean);
      let participantsMap: Record<string, { nickname: string | null; avatar: string | null }> = {};

      if (customerIds.length > 0) {
        const { data: parts } = await supabase
          .from("driver_duel_participants")
          .select("customer_id, public_nickname, avatar_url")
          .in("customer_id", customerIds);

        if (parts) {
          for (const p of parts) {
            participantsMap[p.customer_id] = {
              nickname: p.public_nickname,
              avatar: p.avatar_url,
            };
          }
        }
      }

      return data.map((r: any) => ({
        rankPosition: Number(r.rank_position),
        customerId: r.customer_id,
        driverName: cleanDriverName(r.driver_name),
        totalRides: Number(r.total_rides),
        nickname: participantsMap[r.customer_id]?.nickname || null,
        avatarUrl: participantsMap[r.customer_id]?.avatar || null,
      }));
    },
    enabled: !!branchId,
    refetchInterval: 60_000,
  });
}

export function useMinhaPosicaoRanking(branchId: string | undefined, customerId: string | undefined) {
  return useQuery({
    queryKey: ["minha-posicao-ranking", branchId, customerId],
    queryFn: async (): Promise<MinhaColocacao | null> => {
      if (!branchId || !customerId) return null;

      const { data, error } = await supabase.rpc("get_driver_city_position", {
        p_branch_id: branchId,
        p_customer_id: customerId,
      });
      if (error) throw error;
      if (!data || !Array.isArray(data) || data.length === 0) return null;

      return {
        rankPosition: Number(data[0].rank_position),
        totalRides: Number(data[0].total_rides),
      };
    },
    enabled: !!branchId && !!customerId,
    refetchInterval: 60_000,
  });
}
