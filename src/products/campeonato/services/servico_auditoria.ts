import { supabase } from "@/integrations/supabase/client";
import type { RegistroAuditoria } from "../types/tipos_auditoria";

interface FiltrosAuditoria {
  branchId: string;
  seasonId?: string | null;
  outcome?: "success" | "blocked" | "all";
  limit?: number;
}

export async function listarAuditoriaClassificacao(
  filtros: FiltrosAuditoria,
): Promise<RegistroAuditoria[]> {
  let query = supabase
    .from("duelo_classificacao_auditoria")
    .select("*, duelo_seasons(name)")
    .eq("branch_id", filtros.branchId)
    .order("created_at", { ascending: false })
    .limit(filtros.limit ?? 100);

  if (filtros.seasonId) {
    query = query.eq("season_id", filtros.seasonId);
  }
  if (filtros.outcome && filtros.outcome !== "all") {
    query = query.eq("outcome", filtros.outcome);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    season_id: row.season_id,
    brand_id: row.brand_id,
    branch_id: row.branch_id,
    attempted_by: row.attempted_by,
    outcome: row.outcome,
    block_reason: row.block_reason,
    block_code: row.block_code,
    eligible_count: row.eligible_count,
    required_count: row.required_count,
    divergent_count: row.divergent_count,
    divergent_sample: Array.isArray(row.divergent_sample)
      ? row.divergent_sample
      : [],
    details_json: row.details_json ?? {},
    created_at: row.created_at,
    season_name: row.duelo_seasons?.name ?? null,
  })) as RegistroAuditoria[];
}
