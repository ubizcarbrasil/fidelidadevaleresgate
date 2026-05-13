import { useQuery } from "@tanstack/react-query";
import {
  listarDistribuicoesPendentes,
  listarMotoristasDisponiveis,
  listarTemporadasMarca,
  obterBracketsCompleto,
  obterDashboardCampeonato,
  obterDetalheSerie,
  obterResumoTemporada,
} from "../services/servico_campeonato_empreendedor";
import type { StatusFiltroSeason } from "../types/tipos_empreendedor";

const STALE_DASHBOARD = 30_000;
const STALE_HISTORICO = 5 * 60_000;

export function useDashboardCampeonato(brandId?: string | null) {
  return useQuery({
    queryKey: ["empreendedor-dashboard-campeonato", brandId],
    enabled: !!brandId,
    staleTime: STALE_DASHBOARD,
    refetchInterval: STALE_DASHBOARD,
    queryFn: () => obterDashboardCampeonato(brandId!),
  });
}

export function useTemporadasMarca(
  brandId?: string | null,
  status: StatusFiltroSeason = "all",
) {
  return useQuery({
    queryKey: ["empreendedor-seasons", brandId, status],
    enabled: !!brandId,
    staleTime: STALE_HISTORICO,
    queryFn: () => listarTemporadasMarca(brandId!, status),
  });
}

export function useDetalheSerie(
  seasonId?: string | null,
  tierId?: string | null,
) {
  return useQuery({
    queryKey: ["empreendedor-series-detail", seasonId, tierId],
    enabled: !!seasonId && !!tierId,
    staleTime: STALE_DASHBOARD,
    queryFn: () => obterDetalheSerie(seasonId!, tierId!),
  });
}

export function useBracketsCompleto(seasonId?: string | null) {
  return useQuery({
    queryKey: ["empreendedor-brackets-full", seasonId],
    enabled: !!seasonId,
    staleTime: STALE_DASHBOARD,
    queryFn: () => obterBracketsCompleto(seasonId!),
  });
}

export function useResumoTemporada(seasonId?: string | null) {
  return useQuery({
    queryKey: ["empreendedor-season-summary", seasonId],
    enabled: !!seasonId,
    staleTime: STALE_DASHBOARD,
    queryFn: () => obterResumoTemporada(seasonId!),
  });
}

export function useMotoristasDisponiveis(
  brandId?: string | null,
  seasonId?: string | null,
) {
  return useQuery({
    queryKey: ["empreendedor-drivers-available", brandId, seasonId],
    enabled: !!brandId && !!seasonId,
    staleTime: 30_000,
    queryFn: () => listarMotoristasDisponiveis(brandId!, seasonId!),
  });
}

export function useDistribuicoesPendentes(seasonId?: string | null) {
  return useQuery({
    queryKey: ["empreendedor-prize-distributions", seasonId],
    enabled: !!seasonId,
    staleTime: 60_000,
    queryFn: () => listarDistribuicoesPendentes(seasonId!),
  });
}
