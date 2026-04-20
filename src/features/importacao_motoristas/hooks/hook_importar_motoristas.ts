import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LinhaPlanilha, LinhaMapeada, ResumoMapeamento, ResultadoImportacao } from "../types/tipos_importacao";
import { mapearLinha, calcularResumoMapeamento } from "../utils/mapeador_taximachine";

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

  /** Faz polling no job até concluir. Retorna estado final. */
  const acompanharJob = async (id: string, onUpdate?: (r: ResultadoImportacao) => void): Promise<ResultadoImportacao> => {
    while (true) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await (supabase as any)
        .from("driver_import_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!data) continue;

      const r: ResultadoImportacao = {
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
      onUpdate?.(r);
      setResultado(r);

      if (r.status === "done" || r.status === "error") {
        queryClient.invalidateQueries({ queryKey: ["driver-management"] });
        return r;
      }
    }
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
    reset,
  };
}
