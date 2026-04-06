import { useMemo } from "react";

export interface EstatisticasDuelos {
  totalDisputados: number;
  vitorias: number;
  derrotas: number;
  empates: number;
  recusas: number;
  taxaVitoria: number;
  sequenciaAtual: number;
  maiorSequencia: number;
  desafiosEnviados: number;
  desafiosRecebidos: number;
}

interface Duel {
  id: string;
  status: string;
  challenger_id: string | null;
  challenged_id: string | null;
  winner_id: string | null;
  finished_at?: string | null;
  declined_at?: string | null;
}

export function useEstatisticasDuelos(
  duels: Duel[] | undefined,
  participantId: string | null
): EstatisticasDuelos {
  return useMemo(() => {
    const empty: EstatisticasDuelos = {
      totalDisputados: 0,
      vitorias: 0,
      derrotas: 0,
      empates: 0,
      recusas: 0,
      taxaVitoria: 0,
      sequenciaAtual: 0,
      maiorSequencia: 0,
      desafiosEnviados: 0,
      desafiosRecebidos: 0,
    };

    if (!duels || !participantId) return empty;

    const finished = duels
      .filter((d) => d.status === "finished")
      .sort((a, b) => {
        const da = a.finished_at ? new Date(a.finished_at).getTime() : 0;
        const db = b.finished_at ? new Date(b.finished_at).getTime() : 0;
        return da - db;
      });

    const vitorias = finished.filter((d) => d.winner_id === participantId).length;
    const empates = finished.filter((d) => d.winner_id === null).length;
    const derrotas = finished.length - vitorias - empates;

    const recusas = duels.filter(
      (d) => d.status === "declined" && d.challenged_id === participantId
    ).length;

    const desafiosEnviados = duels.filter(
      (d) => d.challenger_id === participantId
    ).length;

    const desafiosRecebidos = duels.filter(
      (d) => d.challenged_id === participantId
    ).length;

    const taxaVitoria =
      finished.length > 0 ? Math.round((vitorias / finished.length) * 100) : 0;

    // Streaks
    let sequenciaAtual = 0;
    let maiorSequencia = 0;
    let streak = 0;

    for (const d of finished) {
      if (d.winner_id === participantId) {
        streak++;
        if (streak > maiorSequencia) maiorSequencia = streak;
      } else {
        streak = 0;
      }
    }
    sequenciaAtual = streak;

    return {
      totalDisputados: finished.length,
      vitorias,
      derrotas,
      empates,
      recusas,
      taxaVitoria,
      sequenciaAtual,
      maiorSequencia,
      desafiosEnviados,
      desafiosRecebidos,
    };
  }, [duels, participantId]);
}
