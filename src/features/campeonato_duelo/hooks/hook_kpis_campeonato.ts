import { useQuery } from "@tanstack/react-query";
import { obterKpisCampeonato } from "../services/servico_campeonato_empreendedor";

const STALE_KPIS = 30_000;

export function useBrandCampeonatoKPIs(brandId?: string | null) {
  return useQuery({
    queryKey: ["empreendedor-campeonato-kpis", brandId],
    enabled: !!brandId,
    staleTime: STALE_KPIS,
    refetchInterval: STALE_KPIS,
    queryFn: () => obterKpisCampeonato(brandId!),
  });
}