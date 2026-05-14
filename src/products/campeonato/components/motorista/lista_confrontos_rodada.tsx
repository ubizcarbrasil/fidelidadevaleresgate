import CardDueloFutebol from "./card_duelo_futebol";
import type { ConfrontoListagem } from "../../types/tipos_tabela_duelos";

interface Props {
  confrontos: ConfrontoListagem[];
  driverIdLogado: string | null;
  arenaNome?: string | null;
}

export default function ListaConfrontosRodada({
  confrontos,
  driverIdLogado,
  arenaNome,
}: Props) {
  return (
    <div className="grid gap-3">
      {confrontos.map((c) => (
        <CardDueloFutebol
          key={c.id}
          confronto={c}
          driverIdLogado={driverIdLogado}
          arenaNome={arenaNome}
        />
      ))}
    </div>
  );
}