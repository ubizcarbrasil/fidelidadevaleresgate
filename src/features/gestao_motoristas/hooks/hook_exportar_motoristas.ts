import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  exportarTodosMotoristas,
  type ParametrosExportacao,
} from "../services/servico_exportacao_motoristas";
import {
  gerarCsvMotoristas,
  baixarCsvMotoristas,
  exigeGestoDoUsuarioParaSalvar,
} from "../utils/utilitarios_export_motoristas";

export interface ProgressoExportacao {
  atual: number;
  total: number;
}

interface ArquivoPendente {
  blob: Blob;
  nomeArquivo: string;
  totalMotoristas: number;
  excedeuLimite: boolean;
}

export type ParametrosUseExportar = Omit<ParametrosExportacao, "onProgresso">;

/**
 * Hook orquestrador da exportação completa de motoristas.
 * Gerencia loading, progresso por lote e feedback (toasts).
 */
export function useExportarMotoristas() {
  const [exportando, setExportando] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoExportacao | null>(null);
  const [arquivoPendente, setArquivoPendente] = useState<ArquivoPendente | null>(null);

  const notificarConclusao = useCallback(
    (totalMotoristas: number, excedeuLimite: boolean, modo: "share" | "download" | "nova-aba") => {
      const totalFmt = totalMotoristas.toLocaleString("pt-BR");

      if (excedeuLimite) {
        toast.warning(
          `Limite de 20.000 atingido. Exportados ${totalFmt} motoristas. Refine a busca para exportar o restante.`,
        );
        return;
      }

      if (modo === "share") {
        toast.success(`${totalFmt} motoristas prontos. Toque em "Salvar em Arquivos" para guardar.`);
        return;
      }

      if (modo === "nova-aba") {
        toast.success(`${totalFmt} motoristas exportados. Use o menu do navegador para salvar o arquivo.`);
        return;
      }

      toast.success(`${totalFmt} motoristas exportados`);
    },
    [],
  );

  const exportar = useCallback(async (params: ParametrosUseExportar) => {
    if (arquivoPendente) {
      try {
        const modo = await baixarCsvMotoristas(arquivoPendente.blob, arquivoPendente.nomeArquivo);
        setArquivoPendente(null);
        notificarConclusao(arquivoPendente.totalMotoristas, arquivoPendente.excedeuLimite, modo);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        toast.error(err?.message || "Erro ao salvar o arquivo CSV");
      }
      return;
    }

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
      const nomeArquivo = `motoristas-${data}.csv`;

      toast.dismiss(toastId);

      if (exigeGestoDoUsuarioParaSalvar()) {
        setArquivoPendente({
          blob,
          nomeArquivo,
          totalMotoristas: resultado.motoristas.length,
          excedeuLimite: resultado.excedeuLimite,
        });
        toast.success(
          `${resultado.motoristas.length.toLocaleString("pt-BR")} motoristas prontos. Toque em CSV novamente para salvar.`,
        );
        return;
      }

      const modo = await baixarCsvMotoristas(blob, nomeArquivo);
      notificarConclusao(resultado.motoristas.length, resultado.excedeuLimite, modo);
    } catch (err: any) {
      toast.dismiss(toastId);
      // Usuário cancelou o share sheet — não mostrar erro.
      if (err?.name === "AbortError") {
        return;
      }
      toast.error(err?.message || "Erro ao exportar motoristas");
    } finally {
      setExportando(false);
      setProgresso(null);
    }
  }, [arquivoPendente, exportando, notificarConclusao]);

  return { exportar, exportando, progresso, arquivoPendente: !!arquivoPendente };
}