import type { EventoLogConfronto } from "../types/tipos_log_eventos";

const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatarDataHoraEvento(iso: string) {
  return FORMATADOR_DATA_HORA.format(new Date(iso));
}

export function tempoRelativo(iso: string, agora = new Date()) {
  const diffSeg = Math.max(0, Math.floor((agora.getTime() - new Date(iso).getTime()) / 1000));
  if (diffSeg < 60) return `há ${diffSeg}s`;
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

export function rotuloOponente(evento: EventoLogConfronto): string {
  if (evento.lado === "A") return evento.driver_b_name ?? "—";
  if (evento.lado === "B") return evento.driver_a_name ?? "—";
  return "—";
}

export function rotuloEventType(eventType: string): string {
  switch (eventType) {
    case "ride_completed":
      return "Corrida finalizada";
    case "ride_reverted":
      return "Corrida estornada";
    default:
      return eventType;
  }
}