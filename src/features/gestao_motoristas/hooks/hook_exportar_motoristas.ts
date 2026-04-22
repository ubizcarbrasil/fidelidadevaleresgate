import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  exportarTodosMotoristas,
  type ParametrosExportacao,
} from "../services/servico_exportacao_motoristas";
import {
  gerarCsvMotoristas,
  baixarCsvMotoristas,
} from "../utils/utilitarios_export_motoristas";

export interface ProgressoExportacao {
  atual: number;
  total: number;
}

export type ParametrosUseExportar = Omit<ParametrosExportacao, "onProgresso">;

/**
 * Hook orquestrador da exportação completa de motoristas.
 * Gerencia loading, progresso por lote e feedback (toasts).
 */
export function useExportarMotoristas() {
  const [exportando, setExportando] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoExportacao | null>(null);

  const exportar = useCallback(async (params: ParametrosUseExportar) => {
    if (exportando) return;
    if (!params.brandId) {
      toast.error("Marca não identificada");
      return;
    }

    setExportando(true);
    setProgresso({ atual: 0, total: 0 });
    const toastId = toast.loading("Preparando exportação...");

    try {
      const resultado = await exportarTodosMotoristas({
        ...params,
        onProgresso: (atual, total) => {
          setProgresso({ atual, total });
          toast.loading(
            `Exportando ${atual.toLocaleString("pt-BR")} / ${total.toLocaleString("pt-BR")} motoristas...`,
            { id: toastId },
          );
        },
      });

      if (resultado.motoristas.length === 0) {
        toast.dismiss(toastId);
        toast.warning("Nenhum motorista para exportar");
        return;
      }

      const blob = gerarCsvMotoristas(resultado.motoristas);
      const data = new Date().toISOString().slice(0, 10);
      baixarCsvMotoristas(blob, `motoristas-${data}.csv`);

      toast.dismiss(toastId);
      if (resultado.excedeuLimite) {
        toast.warning(
          `Limite de 20.000 atingido. Exportados ${resultado.motoristas.length.toLocaleString("pt-BR")} motoristas. Refine a busca para exportar o restante.`,
        );
      } else {
        toast.success(
          `${resultado.motoristas.length.toLocaleString("pt-BR")} motoristas exportados`,
        );
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || "Erro ao exportar motoristas");
    } finally {
      setExportando(false);
      setProgresso(null);
    }
  }, [exportando]);

  return { exportar, exportando, progresso };
}