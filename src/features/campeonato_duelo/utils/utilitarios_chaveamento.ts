import type {
  ConfrontoMataMata,
  RodadaMataMata,
  TemporadaCampeonato,
} from "../types/tipos_campeonato";

export type StatusConfronto = "aguardando" | "em_andamento" | "encerrado";

export function statusDoConfronto(c: ConfrontoMataMata): StatusConfronto {
  if (c.winner_id) return "encerrado";
  if (!c.driver_a_id || !c.driver_b_id) return "aguardando";
  return "em_andamento";
}

/**
 * Percentual relativo de cada lado em relação ao total de corridas do confronto.
 * Quando ambos zerados, retorna 50/50 só para visual.
 */
export function progressoConfronto(c: ConfrontoMataMata) {
  const total = c.driver_a_rides + c.driver_b_rides;
  if (total === 0) return { pctA: 50, pctB: 50, neutro: true };
  const pctA = Math.round((c.driver_a_rides / total) * 100);
  return { pctA, pctB: 100 - pctA, neutro: false };
}

/**
 * Resumo agregado por rodada (aguardando, em andamento, encerrados, total).
 */
export function resumoRodada(
  rodada: RodadaMataMata,
  confrontos: ConfrontoMataMata[],
) {
  const itens = confrontos.filter((c) => c.round === rodada);
  const encerrados = itens.filter((c) => statusDoConfronto(c) === "encerrado").length;
  const emAndamento = itens.filter((c) => statusDoConfronto(c) === "em_andamento").length;
  const aguardando = itens.filter((c) => statusDoConfronto(c) === "aguardando").length;
  return {
    total: itens.length,
    encerrados,
    emAndamento,
    aguardando,
    completo: itens.length > 0 && encerrados === itens.length,
  };
}

/**
 * Mapeia a fase atual da temporada para a rodada ativa correspondente.
 */
export function rodadaAtivaDaFase(
  fase: TemporadaCampeonato["phase"],
): RodadaMataMata | null {
  switch (fase) {
    case "knockout_r16":
      return "r16";
    case "knockout_qf":
      return "qf";
    case "knockout_sf":
      return "sf";
    case "knockout_final":
      return "final";
    default:
      return null;
  }
}
