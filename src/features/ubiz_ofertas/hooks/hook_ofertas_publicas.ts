import { useQuery } from "@tanstack/react-query";
import { buscarCategoriasAtivas, buscarOfertasAtivas } from "../services/servico_ofertas_publicas";

export function useOfertasPublicas(brandId: string | null) {
  const ofertasQuery = useQuery({
    queryKey: ["ubiz-ofertas-deals", brandId],
    queryFn: () => buscarOfertasAtivas(brandId!),
    enabled: !!brandId,
    staleTime: 60_000,
  });

  const categoriasQuery = useQuery({
    queryKey: ["ubiz-ofertas-categorias", brandId],
    queryFn: () => buscarCategoriasAtivas(brandId!),
    enabled: !!brandId,
    staleTime: 60_000,
  });

  return {
    ofertas: ofertasQuery.data ?? [],
    categorias: categoriasQuery.data ?? [],
    carregando: ofertasQuery.isLoading || categoriasQuery.isLoading,
  };
}