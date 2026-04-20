export const FREQUENCIAS_RESET = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
] as const;

export const ACOES_RESET = [
  { value: "no_zero", label: "Não zerar saldo", description: "Apenas credita o bônus inicial sem apagar o saldo atual." },
  { value: "zero_duel", label: "Zerar pontos de duelo", description: "Zera somente os pontos acumulados em duelos." },
  { value: "zero_rides", label: "Zerar pontos de corrida", description: "Zera somente os pontos vindos de corridas." },
  { value: "zero_both", label: "Zerar tudo", description: "Reseta o saldo total do motorista para zero." },
] as const;

export const STATUS_CAMPANHA = [
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
  { value: "ended", label: "Encerrada" },
] as const;

export type FrequenciaReset = typeof FREQUENCIAS_RESET[number]["value"];
export type AcaoReset = typeof ACOES_RESET[number]["value"];
export type StatusCampanha = typeof STATUS_CAMPANHA[number]["value"];