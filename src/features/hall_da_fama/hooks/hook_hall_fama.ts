import { useQuery } from "@tanstack/react-query";
import { obterHallDaFama } from "../services/servico_hall_fama";

const STALE = 5 * 60_000;

export function useHallDaFama(brandSlug?: string | null) {
  return useQuery({
    queryKey: ["hall-da-fama-publico", brandSlug],
    enabled: !!brandSlug,
    staleTime: STALE,
    queryFn: () => obterHallDaFama(brandSlug!),
    retry: 1,
  });
}