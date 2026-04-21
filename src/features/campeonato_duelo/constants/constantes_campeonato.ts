import type { FaseCampeonato, RodadaMataMata } from "../types/tipos_campeonato";

export const ROTULOS_FASE: Record<FaseCampeonato, string> = {
  classification: "Classificação",
  knockout_r16: "Oitavas de Final",
  knockout_qf: "Quartas de Final",
  knockout_sf: "Semifinal",
  knockout_final: "Final",
  finished: "Encerrada",
};

export const ROTULOS_RODADA: Record<RodadaMataMata, string> = {
  r16: "Oitavas",
  qf: "Quartas",
  sf: "Semifinal",
  final: "Final",
};

export const CORES_FASE: Record<FaseCampeonato, string> = {
  classification: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  knockout_r16: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  knockout_qf: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  knockout_sf: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  knockout_final: "bg-red-500/15 text-red-600 dark:text-red-400",
  finished: "bg-muted text-muted-foreground",
};

export const ORDEM_RODADAS: RodadaMataMata[] = ["r16", "qf", "sf", "final"];

export const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];