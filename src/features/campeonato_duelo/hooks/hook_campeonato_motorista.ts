import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  obterBracketCompleto,
  obterConfrontoAtual,
  obterHistoricoMotorista,
  obterRankingCentrado,
  obterTabelaCompletaTier,
  obterTemporadaAtivaMotorista,
} from "../services/servico_campeonato_motorista";

const STALE_RANKING = 60_000;
const REFETCH_RANKING = 5 * 60_000;

export function useTemporadaAtivaDoMotorista(
  brandId?: string | null,
  driverId?: string | null,
) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["driver-active-season", brandId, driverId],
    enabled: !!brandId && !!driverId,
    staleTime: STALE_RANKING,
    refetchInterval: REFETCH_RANKING,
    queryFn: () => obterTemporadaAtivaMotorista(brandId!, driverId!),
  });

  // Realtime: assim que o seeding distribuir o motorista, refetch imediato.
  useEffect(() => {
    if (!driverId) return;
    const channel = supabase
      .channel(`duelo-membership-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duelo_tier_memberships",
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          qc.invalidateQueries({
            queryKey: ["driver-active-season", brandId, driverId],
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, driverId, qc]);

  return query;
}

export function useRankingCentrado(
  seasonId?: string | null,
  driverId?: string | null,
  range = 2,
) {
  return useQuery({
    queryKey: ["driver-centered-ranking", seasonId, driverId, range],
    enabled: !!seasonId && !!driverId,
    staleTime: STALE_RANKING,
    refetchInterval: REFETCH_RANKING,
    queryFn: () => obterRankingCentrado(seasonId!, driverId!, range),
  });
}

export function useTabelaCompleta(
  seasonId?: string | null,
  driverId?: string | null,
) {
  return useQuery({
    queryKey: ["driver-full-tier-table", seasonId, driverId],
    enabled: !!seasonId && !!driverId,
    staleTime: STALE_RANKING,
    queryFn: () => obterTabelaCompletaTier(seasonId!, driverId!),
  });
}

export function useConfrontoAtual(
  seasonId?: string | null,
  driverId?: string | null,
) {
  return useQuery({
    queryKey: ["driver-current-match", seasonId, driverId],
    enabled: !!seasonId && !!driverId,
    staleTime: STALE_RANKING,
    refetchInterval: REFETCH_RANKING,
    queryFn: () => obterConfrontoAtual(seasonId!, driverId!),
  });
}

export function useBracketCompleto(
  seasonId?: string | null,
  driverId?: string | null,
) {
  return useQuery({
    queryKey: ["driver-full-bracket", seasonId, driverId],
    enabled: !!seasonId && !!driverId,
    staleTime: STALE_RANKING,
    queryFn: () => obterBracketCompleto(seasonId!, driverId!),
  });
}

export function useHistoricoMotorista(
  brandId?: string | null,
  driverId?: string | null,
  limit = 10,
) {
  return useQuery({
    queryKey: ["driver-history", brandId, driverId, limit],
    enabled: !!brandId && !!driverId,
    staleTime: 30 * 60_000,
    queryFn: () => obterHistoricoMotorista(brandId!, driverId!, limit),
  });
}