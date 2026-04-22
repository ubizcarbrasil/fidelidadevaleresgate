import type { OutcomeHistorico } from "../../types/tipos_motorista";

/**
 * Mapeia outcome do histórico para rótulo + cor + emoji/ícone.
 */
export function mapearOutcome(outcome: string): {
  label: string;
  description: string;
  emoji: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  colorClass: string;
} {
  const o = outcome as OutcomeHistorico;
  switch (o) {
    case "champion":
      return {
        label: "Campeão",
        description: "Venceu a final da série",
        emoji: "👑",
        variant: "default",
        colorClass: "text-yellow-500",
      };
    case "promoted":
      return {
        label: "Subiu",
        description: "Promovido para série superior",
        emoji: "⬆️",
        variant: "default",
        colorClass: "text-emerald-500",
      };
    case "relegated":
      return {
        label: "Caiu",
        description: "Rebaixado para série inferior",
        emoji: "⬇️",
        variant: "destructive",
        colorClass: "text-red-500",
      };
    case "relegated_zero":
      return {
        label: "Caiu (Sem Corridas)",
        description: "Rebaixado por inatividade (zero corridas)",
        emoji: "⛔",
        variant: "destructive",
        colorClass: "text-red-600",
      };
    case "stayed":
      return {
        label: "Manteve",
        description: "Permaneceu na mesma série",
        emoji: "✅",
        variant: "secondary",
        colorClass: "text-muted-foreground",
      };
    default:
      return {
        label: outcome,
        description: "Resultado desconhecido",
        emoji: "•",
        variant: "outline",
        colorClass: "text-muted-foreground",
      };
  }
}

export function nomeMes(month: number): string {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return meses[month - 1] ?? String(month);
}

export function nomeRodada(round: string): string {
  switch (round) {
    case "r16": return "Oitavas";
    case "qf": return "Quartas";
    case "sf": return "Semifinal";
    case "final": return "Final";
    default: return round;
  }
}

export function formatarTempoRestante(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const dias = Math.floor(diff / 86_400_000);
  const horas = Math.floor((diff % 86_400_000) / 3_600_000);
  if (dias > 0) return `${dias}d ${horas}h`;
  const minutos = Math.floor((diff % 3_600_000) / 60_000);
  return `${horas}h ${minutos}m`;
}