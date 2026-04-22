import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Args {
  brandId: string | null;
  branchId?: string | null;
}

/**
 * Verifica se existe um job de importação recente (running ou pending) na cidade/marca.
 * Útil para oferecer "Conferir importação em andamento" se o usuário recarregar a página
 * no meio do processo (típico no PWA do iPhone).
 */
export function useJobEmAndamento({ brandId, branchId }: Args) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const recarregar = async () => {
    if (!brandId) {
      setJobId(null);
      return;
    }
    setCarregando(true);
    try {
      // Busca o job mais recente em estado de execução (últimas 2h).
      const desde = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      let q = (supabase as any)
        .from("driver_import_jobs")
        .select("id, status, created_at, branch_id")
        .eq("brand_id", brandId)
        .in("status", ["pending", "running"])
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .limit(1);
      if (branchId) q = q.eq("branch_id", branchId);
      const { data } = await q;
      const found = Array.isArray(data) ? data[0] : null;
      setJobId(found?.id ?? null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void recarregar();
    // refaz checagem a cada 30s — barato, ajuda o iPhone que voltou do background.
    const t = setInterval(() => void recarregar(), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, branchId]);

  return { jobId, carregando, recarregar, limpar: () => setJobId(null) };
}