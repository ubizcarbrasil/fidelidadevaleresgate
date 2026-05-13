import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  moverMotoristasEmLote,
  moverMotoristaParaSerie,
  removerMotoristaDaSeason,
} from "../services/servico_campeonato_empreendedor";
import type {
  MoverEmLoteInput,
  MoverMotoristaInput,
  RemoverMotoristaInput,
} from "../types/tipos_empreendedor";

function invalidarDistribuicao(
  qc: ReturnType<typeof useQueryClient>,
  brandId?: string,
) {
  qc.invalidateQueries({
    queryKey: ["empreendedor-dashboard-campeonato", brandId],
  });
  qc.invalidateQueries({ queryKey: ["empreendedor-series-detail"] });
  qc.invalidateQueries({ queryKey: ["empreendedor-drivers-available"] });
  qc.invalidateQueries({ queryKey: ["empreendedor-season-summary"] });
}

export function useMoverMotorista(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MoverMotoristaInput) => moverMotoristaParaSerie(input),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.reason
          ? "Motorista movido"
          : "Motorista movido entre as séries",
      );
      invalidarDistribuicao(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao mover motorista");
    },
  });
}

export function useRemoverMotorista(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RemoverMotoristaInput) =>
      removerMotoristaDaSeason(input),
    onSuccess: () => {
      toast.success("Motorista removido da temporada");
      invalidarDistribuicao(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao remover motorista");
    },
  });
}

export function useMoverMotoristasEmLote(brandId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MoverEmLoteInput) => moverMotoristasEmLote(input),
    onSuccess: (resultado) => {
      const moved = resultado?.moved ?? 0;
      const failedCount = resultado?.failed?.length ?? 0;
      if (moved > 0) {
        toast.success(
          `${moved} motorista${moved > 1 ? "s movidos" : " movido"} para Série ${
            resultado?.target_tier_name ?? ""
          }`,
        );
      }
      if (failedCount > 0) {
        toast.error(
          `${failedCount} motorista${failedCount > 1 ? "s falharam" : " falhou"} ao mover`,
        );
      }
      invalidarDistribuicao(qc, brandId);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erro ao mover motoristas em lote");
    },
  });
}