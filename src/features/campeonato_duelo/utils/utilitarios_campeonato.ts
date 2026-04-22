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

/**
 * Recebe valor de input type="date" (YYYY-MM-DD) e devolve a mesma data
 * acrescida de N dias, no mesmo formato. Útil para encadear limites mínimos.
 */
export function somarDiasInputDate(input: string, dias: number): string {
  if (!input) return "";
  const [y, m, d] = input.split("-").map(Number);
  const data = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/**
 * Compara duas datas no formato YYYY-MM-DD.
 * Retorna -1 se a < b, 0 se iguais, 1 se a > b. Strings vazias contam como menores.
 */
export function compararInputDate(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Calcula a duração mínima (em dias) da fase de Classificação para que todos
 * os motoristas da maior série consigam se enfrentar de acordo com o modo
 * de pontuação escolhido.
 *
 * - daily_matchup (round-robin "1 confronto/dia"): N - 1 dias
 * - total_points (pontos corridos): N dias, com piso de 7
 */
export function calcularDuracaoMinimaClassificacao(
  series: Array<{ size: number }> | undefined | null,
  scoringMode: "total_points" | "daily_matchup" | string | undefined,
): number {
  const tamanhos = (series ?? [])
    .map((s) => Number(s?.size) || 0)
    .filter((n) => n > 0);
  if (tamanhos.length === 0) return 7;
  const maior = Math.max(...tamanhos);
  if (scoringMode === "daily_matchup") {
    return Math.max(1, maior - 1);
  }
  return Math.max(7, maior);
}

/**
 * Dada uma data de início (YYYY-MM-DD) e uma duração mínima em dias,
 * retorna a data mínima de fim (YYYY-MM-DD), considerando o início como
 * dia 1. Ex.: início 01/01 + 7 dias → 07/01.
 */
export function calcularFimMinimoClassificacao(
  inicio: string,
  dias: number,
): string {
  if (!inicio) return "";
  const offset = Math.max(0, (dias || 1) - 1);
  return somarDiasInputDate(inicio, offset);
}

/**
 * Diferença em dias inclusiva entre duas datas YYYY-MM-DD (start e end contam).
 * Retorna 0 se faltar alguma das datas.
 */
export function diferencaEmDiasInclusiva(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const [ay, am, ad] = inicio.split("-").map(Number);
  const [by, bm, bd] = fim.split("-").map(Number);
  const a = Date.UTC(ay, (am ?? 1) - 1, ad ?? 1);
  const b = Date.UTC(by, (bm ?? 1) - 1, bd ?? 1);
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return diff + 1;
}