import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import AvatarMotorista from "../shared/AvatarMotorista";
import type {
  BracketSlotV2,
  PhaseConfigItem,
} from "../../types/tipos_chaveamento_motorista";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  confronto: BracketSlotV2 | null;
  phaseConfig: PhaseConfigItem[];
}

const FASE_LABEL: Record<BracketSlotV2["phase"], string> = {
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinal",
  final: "Final",
};

const FASE_TO_CONFIG: Record<BracketSlotV2["phase"], PhaseConfigItem["phase"]> = {
  r16: "R16",
  qf: "QF",
  sf: "SF",
  final: "Final",
};

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function diffHM(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { h, m };
}

export default function ModalConfrontoChaveamento({
  open,
  onOpenChange,
  confronto,
  phaseConfig,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [open]);

  const duracaoFase = useMemo(() => {
    if (!confronto) return null;
    const key = FASE_TO_CONFIG[confronto.phase];
    return phaseConfig.find((p) => p.phase === key)?.duration_hours ?? null;
  }, [confronto, phaseConfig]);

  if (!confronto) return null;

  const total = confronto.driver_a_rides + confronto.driver_b_rides;
  const pctA = total === 0 ? 50 : Math.round((confronto.driver_a_rides / total) * 100);
  const pctB = 100 - pctA;

  const startsMs = confronto.starts_at ? new Date(confronto.starts_at).getTime() : null;
  const endsMs = confronto.ends_at ? new Date(confronto.ends_at).getTime() : null;

  const encerrado = !!confronto.winner_id;
  const aguardando = !encerrado && startsMs !== null && now < startsMs;
  const emAndamento =
    !encerrado && !aguardando && startsMs !== null && endsMs !== null && now < endsMs;

  const vencedorNome =
    confronto.winner_id === confronto.driver_a_id
      ? confronto.driver_a_name
      : confronto.winner_id === confronto.driver_b_id
        ? confronto.driver_b_name
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center">
            <Badge className="bg-primary text-primary-foreground">
              {FASE_LABEL[confronto.phase]}
            </Badge>
          </div>
          <DialogTitle className="sr-only">Detalhes do confronto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
          <div className="flex flex-col items-center gap-2 text-center">
            <AvatarMotorista
              nome={confronto.driver_a_name}
              url={confronto.driver_a_photo_url}
              size={56}
            />
            <p className="text-sm font-semibold leading-tight line-clamp-2">
              {confronto.driver_a_name ?? "A definir"}
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground">VS</span>
          <div className="flex flex-col items-center gap-2 text-center">
            <AvatarMotorista
              nome={confronto.driver_b_name}
              url={confronto.driver_b_photo_url}
              size={56}
            />
            <p className="text-sm font-semibold leading-tight line-clamp-2">
              {confronto.driver_b_name ?? "A definir"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-center text-sm tabular-nums">
            {total === 0
              ? "— × —"
              : `${confronto.driver_a_rides} corridas × ${confronto.driver_b_rides} corridas`}
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-primary transition-all"
              style={{ width: `${pctA}%` }}
            />
            <div
              className="bg-accent transition-all"
              style={{ width: `${pctB}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-center text-xs text-muted-foreground">
          {duracaoFase !== null && (
            <p>Confronto de {duracaoFase} horas</p>
          )}
          {encerrado && vencedorNome && (
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-primary">
              <Trophy className="h-4 w-4" />
              Vencedor: {vencedorNome}
            </p>
          )}
          {aguardando && startsMs !== null && (
            <p>Início: {formatarData(confronto.starts_at)}</p>
          )}
          {emAndamento && endsMs !== null && (() => {
            const { h, m } = diffHM(endsMs, now);
            return (
              <p className="text-sm font-semibold text-foreground">
                Encerra em {h}h {m}m
              </p>
            );
          })()}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}