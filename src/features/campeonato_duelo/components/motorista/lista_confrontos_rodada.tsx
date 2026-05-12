import CardConfronto from "../card_confronto";
import type { ConfrontoListagem } from "../../types/tipos_tabela_duelos";
import type {
  ConfrontoMataMata,
  RodadaMataMata,
} from "../../types/tipos_campeonato";

interface Props {
  confrontos: ConfrontoListagem[];
  driverIdLogado: string | null;
}

const RODADAS_VALIDAS: RodadaMataMata[] = ["r16", "qf", "sf", "final"];

function adaptar(c: ConfrontoListagem): ConfrontoMataMata {
  // CardConfronto consome o tipo legado de mata-mata.
  // Para rodadas de classificação (não r16/qf/sf/final), reusamos 'r16'
  // apenas como rótulo neutro — o card não exibe a rodada, só placar/slot.
  const round = (RODADAS_VALIDAS as string[]).includes(c.round)
    ? (c.round as RodadaMataMata)
    : ("r16" as RodadaMataMata);
  return {
    id: c.id,
    season_id: c.season_id,
    round,
    slot: c.slot,
    driver_a_id: c.driver_a_id,
    driver_b_id: c.driver_b_id,
    driver_a_rides: c.driver_a_rides,
    driver_b_rides: c.driver_b_rides,
    winner_id: c.winner_id,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    driver_a_name: c.driver_a_name,
    driver_b_name: c.driver_b_name,
    tier_id: c.tier_id ?? undefined,
  };
}

export default function ListaConfrontosRodada({
  confrontos,
  driverIdLogado,
}: Props) {
  return (
    <div className="grid gap-2">
      {confrontos.map((c) => {
        const destacado = !!(
          driverIdLogado &&
          (c.driver_a_id === driverIdLogado || c.driver_b_id === driverIdLogado)
        );
        return (
          <CardConfronto
            key={c.id}
            confronto={adaptar(c)}
            destacado={destacado}
          />
        );
      })}
    </div>
  );
}