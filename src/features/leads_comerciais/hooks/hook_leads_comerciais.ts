import { useQuery } from "@tanstack/react-query";
import {
  listarLeadsComerciais,
  type FiltrosLeadsComerciais,
} from "../services/servico_leads_comerciais";

export function useLeadsComerciais(filtros: FiltrosLeadsComerciais) {
  return useQuery({
    queryKey: ["leads_comerciais", filtros],
    queryFn: () => listarLeadsComerciais(filtros),
    staleTime: 30_000,
  });
}
