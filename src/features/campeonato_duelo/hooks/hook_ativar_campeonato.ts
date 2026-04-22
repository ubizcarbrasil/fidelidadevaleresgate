import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { alterarStatusAtivacao } from "../services/servico_ativar_campeonato";

/**
 * Mutation que liga/desliga `brand_settings_json.duelo_campeonato_enabled`.
 * Após sucesso, invalida as queries que dependem dessa flag para que a
 * UI reaja imediatamente:
 *  - duelo-campeonato-habilitado (resolver da camada por marca)
 *  - formato-engajamento (seletor de formato)
 *  - dashboard-campeonato (lista de séries / temporada ativa)
 */
export function useAlterarAtivacaoCampeonato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      brandId,
      habilitado,
    }: {
      brandId: string;
      habilitado: boolean;
    }) => alterarStatusAtivacao(brandId, habilitado),
    onSuccess: (data, vars) => {
      toast.success(
        data.habilitado
          ? "Campeonato ativado para esta marca"
          : "Campeonato desativado para esta marca",
      );
      qc.invalidateQueries({
        queryKey: ["duelo-campeonato-habilitado", vars.brandId],
      });
      qc.invalidateQueries({ queryKey: ["formato-engajamento", vars.brandId] });
      qc.invalidateQueries({ queryKey: ["dashboard-campeonato", vars.brandId] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao alterar ativação do campeonato");
    },
  });
}