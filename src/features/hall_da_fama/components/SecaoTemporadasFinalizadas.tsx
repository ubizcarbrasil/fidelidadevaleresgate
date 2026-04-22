import { Trophy } from "lucide-react";
import type { PodioTemporada } from "../types/tipos_hall_fama";
import CardPodioTemporada from "./CardPodioTemporada";

interface Props {
  temporadas: PodioTemporada[];
}

export default function SecaoTemporadasFinalizadas({ temporadas }: Props) {
  if (temporadas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Ainda não há campeões. Aguarde o fim da primeira temporada.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold">Temporadas Finalizadas</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {temporadas.map((p) => (
          <CardPodioTemporada key={p.season_id} podio={p} />
        ))}
      </div>
    </section>
  );
}