import { useQuery } from "@tanstack/react-query";
import { buscarSugestoesDuelo } from "../services/servico_duelos_matching";
import {
  TOLERANCIA_VALORES,
  type ToleranciaMatching,
} from "../types/tipos_duelos_matching";

/**
 * Hook para listar pares sugeridos pelo motor de matching.
 */
export function useSugestoesDuelo(
  branchId: string | null | undefined,
  tolerancia: ToleranciaMatching = "media",
) {
  return useQuery({
    queryKey: ["duelos-matching", branchId, tolerancia],
    enabled: !!branchId,
    queryFn: () => buscarSugestoesDuelo(branchId!, TOLERANCIA_VALORES[tolerancia]),
    staleTime: 30_000,
  });
}

export function useSaldoCarteiraCidade(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["wallet-balance-matching", branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { buscarSaldoCarteira } = await import("../services/servico_duelos_matching");
      return buscarSaldoCarteira(branchId!);
    },
    staleTime: 15_000,
  });
}