import type { RodadaMataMata } from "./tipos_campeonato";

export interface EventoLogConfronto {
  id: string;
  bracket_id: string;
  driver_id: string;
  event_type: string;
  event_ref_id: string | null;
  occurred_at: string;
  // Enriquecido pelo service
  driver_name: string | null;
  bracket_round: RodadaMataMata;
  bracket_slot: number;
  driver_a_id: string | null;
  driver_b_id: string | null;
  driver_a_name: string | null;
  driver_b_name: string | null;
  lado: "A" | "B" | "desconhecido";
}

export interface FiltroLogEventos {
  rodada?: RodadaMataMata | "todas";
  bracketId?: string | "todos";
  driverId?: string | "todos";
  dataInicio?: string | null;
  dataFim?: string | null;
}