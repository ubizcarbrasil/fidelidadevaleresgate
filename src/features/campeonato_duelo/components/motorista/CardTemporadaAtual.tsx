import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock } from "lucide-react";
import type { TemporadaAtivaMotorista } from "../../types/tipos_motorista";
import { formatarTempoRestante } from "./utilitarios_motorista";

interface Props {
  temporada: TemporadaAtivaMotorista;
  fontHeading?: string;
}

export default function CardTemporadaAtual({ temporada, fontHeading }: Props) {
  const isClassification = temporada.phase === "classification";
  const fimRelevante = isClassification
    ? temporada.classification_ends_at
    : temporada.knockout_ends_at;
  const labelFase = isClassification ? "Classificação" : "Mata-Mata";
  const tempo = formatarTempoRestante(fimRelevante);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
              <p
                className="font-bold text-sm truncate"
                style={{ fontFamily: fontHeading }}
              >
                {temporada.season_name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {temporada.tier_name} · {labelFase}
            </p>
          </div>
          <Badge variant="outline" className="gap-1 flex-shrink-0">
            <Clock className="h-3 w-3" />
            {tempo}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Pontos
            </p>
            <p
              className="text-2xl font-bold text-primary"
              style={{ fontFamily: fontHeading }}
            >
              {temporada.driver_points}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              FDS
            </p>
            <p
              className="text-2xl font-bold"
              style={{ fontFamily: fontHeading }}
            >
              {temporada.driver_weekend_rides}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}