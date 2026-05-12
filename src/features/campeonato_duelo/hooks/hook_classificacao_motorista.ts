import { useQuery } from "@tanstack/react-query";
import { obterClassificacaoTier } from "../services/servico_classificacao_motorista";

export function useClassificacaoTier(
  seasonId: string | null,
  tierId: string | null,
  driverId: string | null,
) {
  return useQuery({
    queryKey: ["campeonato-classificacao-tier", seasonId, tierId, driverId],
    enabled: !!seasonId && !!tierId && !!driverId,
    queryFn: () => obterClassificacaoTier(seasonId!, tierId!, driverId!),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}