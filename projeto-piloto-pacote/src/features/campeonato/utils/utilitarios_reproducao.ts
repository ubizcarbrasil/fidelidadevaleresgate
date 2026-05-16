import type { EventoLogConfronto } from "../types/tipos_log_eventos";
import type { QuadroSnapshot, SnapshotConfronto } from "../types/tipos_reproducao";

/**
 * Constrói o snapshot inicial (zero corridas) a partir do conjunto único
 * de brackets observados nos eventos.
 */
export function snapshotInicial(eventosOrdenados: EventoLogConfronto[]): QuadroSnapshot {
  const porBracket: Record<string, SnapshotConfronto> = {};
  for (const ev of eventosOrdenados) {
    if (!porBracket[ev.bracket_id]) {
      porBracket[ev.bracket_id] = {
        bracket_id: ev.bracket_id,
        round: ev.bracket_round,
        slot: ev.bracket_slot,
        driver_a_id: ev.driver_a_id,
        driver_b_id: ev.driver_b_id,
        driver_a_name: ev.driver_a_name,
        driver_b_name: ev.driver_b_name,
        driver_a_rides: 0,
        driver_b_rides: 0,
      };
    }
  }
  return {
    indiceEvento: -1,
    timestamp: null,
    porBracket,
    bracketAfetado: null,
    ladoAfetado: null,
  };
}

/**
 * Aplica eventos do índice 0 até `ateIndice` (inclusivo) sobre o estado inicial.
 * Eventos `ride_completed` somam +1 no lado correspondente; `ride_reverted` decrementa (mín 0).
 */
export function reproduzirAteIndice(
  eventosOrdenados: EventoLogConfronto[],
  ateIndice: number,
): QuadroSnapshot {
  const base = snapshotInicial(eventosOrdenados);
  if (ateIndice < 0) return base;

  let bracketAfetado: string | null = null;
  let ladoAfetado: "A" | "B" | null = null;
  let timestamp: string | null = null;

  for (let i = 0; i <= ateIndice && i < eventosOrdenados.length; i++) {
    const ev = eventosOrdenados[i];
    const snap = base.porBracket[ev.bracket_id];
    if (!snap) continue;
    const delta = ev.event_type === "ride_reverted" ? -1 : 1;
    if (ev.lado === "A") {
      snap.driver_a_rides = Math.max(0, snap.driver_a_rides + delta);
      ladoAfetado = "A";
    } else if (ev.lado === "B") {
      snap.driver_b_rides = Math.max(0, snap.driver_b_rides + delta);
      ladoAfetado = "B";
    } else {
      ladoAfetado = null;
    }
    bracketAfetado = ev.bracket_id;
    timestamp = ev.occurred_at;
  }

  return {
    indiceEvento: ateIndice,
    timestamp,
    porBracket: base.porBracket,
    bracketAfetado,
    ladoAfetado,
  };
}