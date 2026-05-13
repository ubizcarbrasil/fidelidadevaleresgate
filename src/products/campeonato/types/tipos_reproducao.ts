import type { RodadaMataMata } from "./tipos_campeonato";

export interface SnapshotConfronto {
  bracket_id: string;
  round: RodadaMataMata;
  slot: number;
  driver_a_id: string | null;
  driver_b_id: string | null;
  driver_a_name: string | null;
  driver_b_name: string | null;
  driver_a_rides: number;
  driver_b_rides: number;
}

export interface QuadroSnapshot {
  /** Índice do evento mais recente aplicado (-1 = estado inicial). */
  indiceEvento: number;
  /** Timestamp do último evento aplicado, se houver. */
  timestamp: string | null;
  /** Snapshot por bracket_id. */
  porBracket: Record<string, SnapshotConfronto>;
  /** ID do bracket afetado pelo último evento aplicado (para destaque). */
  bracketAfetado: string | null;
  /** Lado (A/B) afetado pelo último evento aplicado. */
  ladoAfetado: "A" | "B" | null;
}