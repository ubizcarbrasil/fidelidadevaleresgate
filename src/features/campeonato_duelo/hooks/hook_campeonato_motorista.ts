import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["driver-active-season", brandId, driverId],
    enabled: !!brandId && !!driverId,
    staleTime: STALE_RANKING,
    refetchInterval: REFETCH_RANKING,
    queryFn: () => obterTemporadaAtivaMotorista(brandId!, driverId!),
  });
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