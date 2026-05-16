import { useQuery } from "@tanstack/react-query";
import { obterFormatoEngajamento } from "../services/servico_campeonato_motorista";
import type { FormatoEngajamento } from "../types/tipos_motorista";

/**
 * Resolve o formato de engajamento ativo do duelo_motorista para uma marca.
 * Retorna 'duelo' como default se nada estiver configurado.
 */
export function useFormatoEngajamento(brandId?: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ["duelo-engagement-format", brandId],
    enabled: !!brandId,
    staleTime: 60_000,
    queryFn: () => obterFormatoEngajamento(brandId!),
  });
  return {
    formato: (data ?? "duelo") as FormatoEngajamento,
    isCampeonato: data === "campeonato",
    isLoading,
  };
}