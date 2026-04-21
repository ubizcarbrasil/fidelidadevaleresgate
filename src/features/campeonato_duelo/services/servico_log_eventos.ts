import { supabase } from "@/integrations/supabase/client";
import type { EventoLogConfronto } from "../types/tipos_log_eventos";
import type { RodadaMataMata } from "../types/tipos_campeonato";

/**
 * Lista os eventos (corridas pontuadas) que afetaram os confrontos
 * de uma temporada, ordenados do mais recente para o mais antigo.
 * Faz join com brackets (para round/slot/lados) e customers (nome).
 */
export async function listarEventosTemporada(
  seasonId: string,
  limite = 200,
): Promise<EventoLogConfronto[]> {
  const { data, error } = await supabase
    .from("duelo_match_events")
    .select(
      `
        id,
        bracket_id,
        driver_id,
        event_type,
        event_ref_id,
        occurred_at,
        driver:customers!duelo_match_events_driver_id_fkey(name),
        bracket:duelo_brackets!inner(
          season_id,
          round,
          slot,
          driver_a_id,
          driver_b_id,
          driver_a:customers!duelo_brackets_driver_a_id_fkey(name),
          driver_b:customers!duelo_brackets_driver_b_id_fkey(name)
        )
      `,
    )
    .eq("bracket.season_id", seasonId)
    .order("occurred_at", { ascending: false })
    .limit(limite);

  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => {
    const driverAId = row.bracket?.driver_a_id ?? null;
    const driverBId = row.bracket?.driver_b_id ?? null;
    let lado: "A" | "B" | "desconhecido" = "desconhecido";
    if (row.driver_id === driverAId) lado = "A";
    else if (row.driver_id === driverBId) lado = "B";

    return {
      id: row.id,
      bracket_id: row.bracket_id,
      driver_id: row.driver_id,
      event_type: row.event_type,
      event_ref_id: row.event_ref_id,
      occurred_at: row.occurred_at,
      driver_name: row.driver?.name ?? null,
      bracket_round: (row.bracket?.round ?? "r16") as RodadaMataMata,
      bracket_slot: row.bracket?.slot ?? 0,
      driver_a_id: driverAId,
      driver_b_id: driverBId,
      driver_a_name: row.bracket?.driver_a?.name ?? null,
      driver_b_name: row.bracket?.driver_b?.name ?? null,
      lado,
    } satisfies EventoLogConfronto;
  });
}