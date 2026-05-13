import { useQuery } from "@tanstack/react-query";
import { obterTopRiders } from "../services/servico_artilharia";
import type { JanelaArtilharia } from "../types/tipos_artilharia";

export function useTopRiders(
  seasonId: string | null,
  window: JanelaArtilharia,
  enabled = true,
) {
  return useQuery({
    queryKey: ["campeonato-artilharia", seasonId, window],
    queryFn: () => obterTopRiders(seasonId!, window),
    enabled: !!seasonId && enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}