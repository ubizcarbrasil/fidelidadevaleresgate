import { Gift, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AvatarMotorista } from "../shared/AvatarMotorista";
import ListaHistorico from "./ListaHistorico";
import type { TopRider } from "../../types/tipos_artilharia";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  rider: TopRider | null;
  janelaLabel: string;
  isMe?: boolean;
}

function medalha(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function ModalDetalhesMotorista({
  open,
  onOpenChange,
  brandId,
  rider,
  janelaLabel,
  isMe,
}: Props) {
  if (!rider) return null;
  const med = medalha(rider.rank);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Detalhes do motorista</DialogTitle>
        </DialogHeader>

        {/* Cabeçalho do motorista */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <AvatarMotorista
            nome={rider.driver_name}
            url={rider.photo_url}
            size={56}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {rider.driver_name ?? "Motorista"}
              {isMe && (
                <span className="ml-2 text-[10px] font-bold text-primary">
                  VOCÊ
                </span>
              )}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold border border-border">
                {med ?? `#${rider.rank}`}
                <span className="text-muted-foreground font-normal">
                  · {janelaLabel}
                </span>
              </span>
              {rider.has_prize && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <Gift className="h-3 w-3" />
                  Prêmio
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Corridas ({janelaLabel})
            </p>
            <p className="mt-1 text-xl font-bold">{rider.total_rides}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Posição
            </p>
            <p className="mt-1 text-xl font-bold flex items-center gap-1">
              {med ? (
                <span>{med}</span>
              ) : (
                <>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  {rider.rank}º
                </>
              )}
            </p>
          </div>
        </div>

        {/* Histórico no campeonato */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground px-1">
            Histórico no campeonato
          </p>
          <ListaHistorico
            brandId={brandId}
            driverId={rider.driver_id}
            limite={5}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}