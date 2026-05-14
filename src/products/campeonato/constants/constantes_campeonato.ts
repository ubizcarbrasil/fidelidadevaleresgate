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

/**
 * Duração padrão (em horas) de cada fase no modo de criação automática.
 * A Classificação (fase de grupos / pontos corridos / todos contra todos)
 * precisa de uma janela longa o suficiente para todos da maior série se
 * enfrentarem — por padrão usamos 14 dias (336h). Mata-mata segue rodadas
 * curtas: Oitavas 48h, Quartas 72h, Semi 96h, Final 120h.
 */
export const DURACOES_FASES_PADRAO_HORAS = {
  duelo: 24 * 14,
  oitavas: 48,
  quartas: 72,
  semi: 96,
  final: 120,
} as const;

/**
 * Chave em `brands.brand_settings_json` que ativa o Campeonato como
 * produto independente (standalone), exibido no menu principal fora
 * do módulo de Gamificação.
 *
 * - `true`  → Campeonato aparece no menu como produto próprio.
 * - `false` (default / ausente) → comportamento atual (dentro de Gamificação).
 */
export const CAMPEONATO_STANDALONE_KEY = "campeonato_standalone_enabled";