import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LinhaPlanilha, LinhaMapeada, ResumoMapeamento, ResultadoImportacao } from "../types/tipos_importacao";
import { ImportacaoTimeoutError } from "../types/tipos_importacao";
import { mapearLinha, calcularResumoMapeamento } from "../utils/mapeador_taximachine";

const POLLING_INTERVAL_MS = 1500;
/** Tempo máximo absoluto de polling: 20 minutos. */
const POLLING_MAX_MS = 20 * 60 * 1000;
/** Tempo sem evolução em processed_rows antes de avisar o usuário: 60s. */
const POLLING_STALE_MS = 60 * 1000;

interface Args {
  brandId: string;
  branchId?: string | null;
}

export function useImportarMotoristas({ brandId, branchId }: Args) {
  const [linhasBrutas, setLinhasBrutas] = useState<LinhaPlanilha[]>([]);
  const [resumo, setResumo] = useState<ResumoMapeamento | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const carregarPlanilha = (linhas: LinhaPlanilha[]) => {
    setLinhasBrutas(linhas);
    setResumo(linhas[0] ? calcularResumoMapeamento(linhas[0]) : null);
    setResultado(null);
    setJobId(null);
    setErro(null);
  };

  const reset = () => {
    setLinhasBrutas([]);
    setResumo(null);
    setEnviando(false);
    setJobId(null);
    setResultado(null);
    setErro(null);
  };

  const iniciarImportacao = async (): Promise<string | null> => {
    setEnviando(true);
    setErro(null);
    try {
      const mapeadas: LinhaMapeada[] = linhasBrutas.map(mapearLinha);
      const { data, error } = await supabase.functions.invoke("import-drivers-bulk", {
        body: { brand_id: brandId, branch_id: branchId ?? null, rows: mapeadas },
      });
      if (error) throw error;
      const id = (data as { job_id?: string })?.job_id;
      if (!id) throw new Error("Resposta sem job_id");
      setJobId(id);
      return id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao iniciar importação";
      setErro(msg);
      return null;
    } finally {
      setEnviando(false);
    }
  };

  /** Consulta um job uma única vez (sem polling) — burlando cache do SW. */
  const consultarJob = async (id: string): Promise<ResultadoImportacao | null> => {
    // Usar fetch direto com cache-busting (?_t=...) garante que o Service Worker
    // não devolve resposta antiga. Mesmo com NetworkOnly no SW novo, mantemos
    // a defesa para clientes que ainda têm o SW v6 ativo.
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/driver_import_jobs?id=eq.${id}&select=*&_t=${Date.now()}`;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? apiKey;

    const resp = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Accept: "application/json",
      },
    });
    if (!resp.ok) return null;
    const arr = (await resp.json()) as any[];
    const data = arr?.[0];
    if (!data) return null;

    return {
      job_id: data.id,
      status: data.status,
      total_rows: data.total_rows,
      processed_rows: data.processed_rows,
      created_count: data.created_count,
      updated_count: data.updated_count,
      skipped_count: data.skipped_count,
      error_count: data.error_count,
      errors_json: data.errors_json || [],
    };
  };

  /**
   * Faz polling no job até concluir.
   * - Lança ImportacaoTimeoutError após 20min ou se ficar 60s sem evolução.
   * - Sempre busca via fetch com cache-busting para evitar SW cache.
   */
  const acompanharJob = async (
    id: string,
    onUpdate?: (r: ResultadoImportacao) => void
  ): Promise<ResultadoImportacao> => {
    const inicioAbsoluto = Date.now();
    let ultimaMudancaEm = Date.now();
    let ultimoProcessed = -1;

    while (true) {
      await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));

      const agora = Date.now();
      if (agora - inicioAbsoluto > POLLING_MAX_MS) {
        throw new ImportacaoTimeoutError(id, "Tempo máximo de acompanhamento atingido (20min)");
      }

      const r = await consultarJob(id);
      if (!r) {
        // Ainda sem registro: verifica se ficamos muito tempo sem nenhum dado
        if (agora - ultimaMudancaEm > POLLING_STALE_MS) {
          throw new ImportacaoTimeoutError(id, "Sem resposta do servidor há mais de 60s");
        }
        continue;
      }

      // Detecta evolução real
      if (r.processed_rows !== ultimoProcessed || r.status !== "running") {
        ultimoProcessed = r.processed_rows;
        ultimaMudancaEm = agora;
      } else if (agora - ultimaMudancaEm > POLLING_STALE_MS) {
        // Sem evolução por mais de 60s — provável cache ou stall
        throw new ImportacaoTimeoutError(id, "Sem evolução do servidor há mais de 60s");
      }

      onUpdate?.(r);
      setResultado(r);

      if (r.status === "done" || r.status === "error") {
        queryClient.invalidateQueries({ queryKey: ["driver-management"] });
        return r;
      }
    }
  };

  /** Anexa o estado a um job já existente (recuperação após reload/perda de modal). */
  const anexarJobExistente = (id: string) => {
    setJobId(id);
    setErro(null);
    setResultado(null);
  };

  return {
    linhasBrutas,
    resumo,
    enviando,
    jobId,
    resultado,
    erro,
    carregarPlanilha,
    iniciarImportacao,
    acompanharJob,
    consultarJob,
    anexarJobExistente,
    reset,
  };
}
