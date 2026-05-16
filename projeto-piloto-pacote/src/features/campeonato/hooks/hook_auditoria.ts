import { useQuery } from "@tanstack/react-query";
import { listarAuditoriaClassificacao } from "../services/servico_auditoria";

interface ParametrosAuditoria {
  branchId: string | null | undefined;
  seasonId?: string | null;
  outcome?: "success" | "blocked" | "all";
}

export function useAuditoriaClassificacao(params: ParametrosAuditoria) {
  return useQuery({
    queryKey: [
      "campeonato_auditoria",
      params.branchId,
      params.seasonId ?? null,
      params.outcome ?? "all",
    ],
    queryFn: () =>
      listarAuditoriaClassificacao({
        branchId: params.branchId!,
        seasonId: params.seasonId ?? null,
        outcome: params.outcome ?? "all",
      }),
    enabled: !!params.branchId,
    staleTime: 15_000,
  });
}
