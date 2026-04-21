import { NOMES_MESES } from "../constants/constantes_campeonato";

export function nomeAutomaticoTemporada(year: number, month: number): string {
  return `${NOMES_MESES[month - 1]} ${year}`;
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatarPeriodo(inicio: string, fim: string): string {
  return `${formatarData(inicio)} → ${formatarData(fim)}`;
}

/**
 * Gera datas padrão sugeridas para uma temporada nova:
 * Classificação: dia 1 → 14
 * Mata-mata: dia 15 → último dia do mês
 */
export function gerarDatasSugeridas(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const classEnd = new Date(Date.UTC(year, month - 1, 14, 23, 59, 59));
  const knockStart = new Date(Date.UTC(year, month - 1, 15, 0, 0, 0));
  const knockEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return {
    classificationStartsAt: start.toISOString(),
    classificationEndsAt: classEnd.toISOString(),
    knockoutStartsAt: knockStart.toISOString(),
    knockoutEndsAt: knockEnd.toISOString(),
  };
}

export function paraInputDate(iso: string): string {
  return iso ? iso.slice(0, 10) : "";
}

export function deInputDate(input: string, fimDoDia = false): string {
  if (!input) return new Date().toISOString();
  const d = new Date(input + (fimDoDia ? "T23:59:59" : "T00:00:00"));
  return d.toISOString();
}