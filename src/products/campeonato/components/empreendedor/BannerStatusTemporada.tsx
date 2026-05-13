import { Pause, X, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRetomarTemporada } from "../../hooks/hook_mutations_campeonato";
import { formatarData } from "../../utils/utilitarios_campeonato";

interface Props {
  brandId: string;
  seasonId: string;
  pausedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  isFinished: boolean;
}

export default function BannerStatusTemporada({
  brandId,
  seasonId,
  pausedAt,
  cancelledAt,
  cancellationReason,
  isFinished,
}: Props) {
  const retomar = useRetomarTemporada(brandId);

  if (cancelledAt) {
    return (
      <div className="flex flex-col gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2">
          <X className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="text-sm font-medium">
              Temporada cancelada em {formatarData(cancelledAt)}
            </p>
            {cancellationReason && (
              <p className="text-xs text-muted-foreground">
                Motivo: {cancellationReason}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (pausedAt) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2">
          <Pause className="mt-0.5 h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-medium">
              Temporada pausada em {formatarData(pausedAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pontuação por corrida e avanço de fase estão suspensos.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => retomar.mutate(seasonId)}
          disabled={retomar.isPending}
        >
          <Play className="mr-2 h-3.5 w-3.5" /> Retomar
        </Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
        <p className="text-sm font-medium">Temporada finalizada</p>
      </div>
    );
  }

  return null;
}
