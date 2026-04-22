import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  exportarTodosMotoristas,
  type ParametrosExportacao,
} from "../services/servico_exportacao_motoristas";
import {
  gerarCsvMotoristas,
  uploadCsvParaStorage,
  abrirCsvPorUrl,
  exigeUrlHttps,
} from "../utils/utilitarios_export_motoristas";

export interface ProgressoExportacao {
  atual: number;
  total: number;
}

export interface ArquivoPendente {
  url: string;
  nomeArquivo: string;
  caminhoStorage: string;
  expiraEm: Date;
  totalMotoristas: number;
  excedeuLimite: boolean;
}

export type ParametrosUseExportar = Omit<ParametrosExportacao, "onProgresso">;

/**
 * Hook orquestrador da exportação completa de motoristas.
 *
 * Fluxo definitivo (resiliente a iOS/PWA):
 *  1. Busca todos os motoristas em lotes
 *  2. Gera CSV (Blob)
 *  3. Faz upload para Supabase Storage (bucket privado)
 *  4. Gera URL HTTPS assinada (válida 30min)
 *  5. Em desktop: dispara download imediatamente
 *     Em iOS/PWA: guarda a URL e exige 2º toque do usuário
 *  6. 2º toque chama `window.location.assign(url)` — URL real, sem blob:
 */
export function useExportarMotoristas() {
  const [exportando, setExportando] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoExportacao | null>(null);
  const [arquivoPendente, setArquivoPendente] = useState<ArquivoPendente | null>(null);

  const notificarConclusao = useCallback(
    (totalMotoristas: number, excedeuLimite: boolean) => {
      const totalFmt = totalMotoristas.toLocaleString("pt-BR");
      if (excedeuLimite) {
        toast.warning(
          `Limite de 20.000 atingido. Exportados ${totalFmt} motoristas. Refine a busca para exportar o restante.`,
        );
        return;
      }
      toast.success(`${totalFmt} motoristas exportados`);
    },
    [],
  );

  const exportar = useCallback(
    async (params: ParametrosUseExportar) => {
      // 2º toque (iOS/PWA): consome URL pronta — apenas navega para a URL HTTPS real.
      if (arquivoPendente) {
        try {
          await abrirCsvPorUrl(arquivoPendente.url, arquivoPendente.nomeArquivo);
          notificarConclusao(arquivoPendente.totalMotoristas, arquivoPendente.excedeuLimite);
          setArquivoPendente(null);
        } catch (err: any) {
          toast.error(err?.message || "Erro ao abrir o arquivo CSV");
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

        toast.loading("Enviando CSV para download seguro...", { id: toastId });

        const blob = gerarCsvMotoristas(resultado.motoristas);
        const data = new Date().toISOString().slice(0, 10);
        const nomeArquivo = `motoristas-${data}.csv`;

        const { url, caminhoStorage, expiraEm } = await uploadCsvParaStorage(blob, nomeArquivo);

        toast.dismiss(toastId);

        // iOS/PWA: precisa de 2º toque (gesto direto do usuário) para navegar.
        if (exigeUrlHttps()) {
          setArquivoPendente({
            url,
            nomeArquivo,
            caminhoStorage,
            expiraEm,
            totalMotoristas: resultado.motoristas.length,
            excedeuLimite: resultado.excedeuLimite,
          });
          toast.success(
            `${resultado.motoristas.length.toLocaleString("pt-BR")} motoristas prontos. Toque em "Abrir CSV" para baixar.`,
          );
          return;
        }

        // Desktop: dispara download direto (mesma interação do clique original).
        await abrirCsvPorUrl(url, nomeArquivo);
        notificarConclusao(resultado.motoristas.length, resultado.excedeuLimite);
      } catch (err: any) {
        toast.dismiss(toastId);
        if (err?.name === "AbortError") return;
        toast.error(err?.message || "Erro ao exportar motoristas");
      } finally {
        setExportando(false);
        setProgresso(null);
      }
    },
    [arquivoPendente, exportando, notificarConclusao],
  );

  const limparArquivoPendente = useCallback(() => setArquivoPendente(null), []);

  return {
    exportar,
    exportando,
    progresso,
    arquivoPendente: !!arquivoPendente,
    arquivoPendenteDetalhes: arquivoPendente,
    limparArquivoPendente,
  };
}