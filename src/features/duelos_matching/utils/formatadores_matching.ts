import type { FaixaHoraria } from "../types/tipos_duelos_matching";

/**
 * Helpers visuais para a feature de matching de duelos.
 */

export const ROTULO_FAIXA: Record<FaixaHoraria, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  madrugada: "Madrugada",
  sem_dados: "Sem dados",
};

export const EMOJI_FAIXA: Record<FaixaHoraria, string> = {
  manha: "🌅",
  tarde: "☀️",
  noite: "🌙",
  madrugada: "🌌",
  sem_dados: "❓",
};

export function formatarFaixa(faixa: FaixaHoraria): string {
  return `${EMOJI_FAIXA[faixa]} ${ROTULO_FAIXA[faixa]}`;
}

export function classificarScore(score: number): { label: string; tone: "alto" | "medio" | "baixo" } {
  if (score >= 80) return { label: "Excelente", tone: "alto" };
  if (score >= 60) return { label: "Bom", tone: "medio" };
  return { label: "Regular", tone: "baixo" };
}

export function formatarTier(tier: string | null): string {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}