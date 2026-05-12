import { useQuery } from "@tanstack/react-query";
import { obterBracketV2 } from "../services/servico_chaveamento_motorista";

export function useBracketCampeonatoV2(
  seasonId: string | null,
  tierId: string | null,
  driverId: string | null,
) {
  return useQuery({
    queryKey: ["campeonato-bracket-v2", seasonId, tierId, driverId],
    enabled: !!seasonId && !!tierId && !!driverId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: () => obterBracketV2(seasonId!, tierId!, driverId!),
  });
}