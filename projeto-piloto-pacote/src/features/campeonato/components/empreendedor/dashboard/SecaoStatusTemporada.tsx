import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";
import { CORES_FASE, ROTULOS_FASE } from "../../../constants/constantes_campeonato";
import { formatarPeriodo } from "../../../utils/utilitarios_campeonato";
import type { FaseCampeonato } from "../../../types/tipos_campeonato";

interface Props {
  seasonName: string;
  phase: FaseCampeonato | "cancelled";
  classificationStartsAt: string;
  classificationEndsAt: string;
  knockoutStartsAt: string;
  knockoutEndsAt: string;
}

/**
 * Seção 1 do Dashboard de Operação do Campeonato.
 * Exibe o status macro da temporada ativa + janelas de classificação e mata-mata,
 * com barra de progresso da fase atual.
 */
export default function SecaoStatusTemporada({
  seasonName,
  phase,
  classificationStartsAt,
  classificationEndsAt,
  knockoutStartsAt,
  knockoutEndsAt,
}: Props) {
  const agora = Date.now();
  const fase = phase as FaseCampeonato;

  const inicioFase =
    fase === "classification"
      ? new Date(classificationStartsAt).getTime()
      : new Date(knockoutStartsAt).getTime();
  const fimFase =
    fase === "classification"
      ? new Date(classificationEndsAt).getTime()
      : new Date(knockoutEndsAt).getTime();

  const total = Math.max(1, fimFase - inicioFase);
  const decorrido = Math.min(total, Math.max(0, agora - inicioFase));
  const progressoPct = Math.round((decorrido / total) * 100);

  const corLabel = CORES_FASE[fase] ?? "";
  const rotulo = ROTULOS_FASE[fase] ?? phase;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              <h3 className="truncate text-sm font-semibold">{seasonName}</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Status atual da temporada em andamento
            </p>
          </div>
          <Badge variant="outline" className={`text-[11px] ${corLabel}`}>
            {rotulo}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progresso da fase</span>
            <span className="font-medium tabular-nums text-foreground">
              {progressoPct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
        </div>

        <div className="grid gap-1.5 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Classificação:{" "}
            <span className="text-foreground">
              {formatarPeriodo(classificationStartsAt, classificationEndsAt)}
            </span>
          </p>
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Mata-mata:{" "}
            <span className="text-foreground">
              {formatarPeriodo(knockoutStartsAt, knockoutEndsAt)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}