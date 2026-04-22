import { Card, CardContent } from "@/components/ui/card";
import { Crown, Medal } from "lucide-react";
import type { PodioTemporada } from "../types/tipos_hall_fama";
import { formatarMesAno, inicialOuTraco } from "../utils/utilitarios_anonimizacao";

interface Props {
  podio: PodioTemporada;
}

export default function CardPodioTemporada({ podio }: Props) {
  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{podio.season_name}</h3>
          <span className="text-xs text-muted-foreground">
            {formatarMesAno(podio.month, podio.year)}
          </span>
        </div>

        <div className="space-y-2 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold">
              {inicialOuTraco(podio.champion)}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              Campeão
            </span>
          </div>

          {podio.runner_up && (
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-slate-400" />
              <span className="text-sm">{inicialOuTraco(podio.runner_up)}</span>
              <span className="ml-auto text-xs text-muted-foreground">Vice</span>
            </div>
          )}

          {podio.semifinalists.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Medal className="h-4 w-4 text-amber-700" />
              {podio.semifinalists.map((nome, idx) => (
                <span
                  key={`${podio.season_id}-sf-${idx}`}
                  className="text-xs text-muted-foreground"
                >
                  {nome}
                  {idx < podio.semifinalists.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}