import type { CodigoBloqueioAuditoria } from "../types/tipos_auditoria";

export const ROTULOS_BLOQUEIO: Record<CodigoBloqueioAuditoria, string> = {
  unauthorized: "Sem permissão",
  invalid_phase: "Fase inválida",
  bracket_exists: "Chaveamento já existente",
  insufficient_eligible: "Elegíveis insuficientes",
  insufficient_qualified: "Qualificados insuficientes",
  divergent_points: "Pontos divergentes",
};

export const CORES_BLOQUEIO: Record<CodigoBloqueioAuditoria, string> = {
  unauthorized: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  invalid_phase: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  bracket_exists: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  insufficient_eligible: "bg-red-500/15 text-red-600 dark:text-red-400",
  insufficient_qualified: "bg-red-500/15 text-red-600 dark:text-red-400",
  divergent_points: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
};
