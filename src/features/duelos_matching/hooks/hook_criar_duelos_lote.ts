import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { criarDuelosEmLote, type CriarLoteParams } from "../services/servico_duelos_matching";
import { formatPoints } from "@/lib/formatPoints";

/**
 * Hook que dispara a criação em lote e dá feedback ao admin.
 */
export function useCriarDuelosLote(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CriarLoteParams) => criarDuelosEmLote(params),
    onSuccess: (resp, vars) => {
      if (!resp.success) {
        if (resp.error === "Saldo insuficiente") {
          toast.error(
            `Saldo insuficiente. Saldo: ${formatPoints(resp.balance ?? 0)} pts · Necessário: ${formatPoints(resp.required ?? 0)} pts`,
          );
        } else {
          toast.error(resp.error ?? "Falha ao criar duelos em lote");
        }
        return;
      }

      toast.success(
        `${resp.created_count ?? 0} duelos criados${(resp.total_cost ?? 0) > 0 ? ` · ${formatPoints(resp.total_cost ?? 0)} pts debitados` : ""}`,
      );

      queryClient.invalidateQueries({ queryKey: ["duelos-matching", vars.branchId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance-matching", vars.branchId] });
      queryClient.invalidateQueries({ queryKey: ["admin-duelos", vars.branchId] });
      onSuccessCallback?.();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro inesperado ao criar duelos");
    },
  });
}