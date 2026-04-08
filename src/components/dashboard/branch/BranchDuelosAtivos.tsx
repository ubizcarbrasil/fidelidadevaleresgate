/**
 * Lista de duelos ativos/recentes da cidade para o painel admin.
 */
import { Flame, Clock, Handshake, UserPlus, Trophy, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDuelosCidade } from "@/components/driver/duels/hook_duelos_publicos";
import { resolveParticipantName, useContagemCorridasDuelo, type Duel } from "@/components/driver/duels/hook_duelos";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  branchId: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; cor: string; label: string }> = {
  live: { icon: <Flame className="h-3 w-3" />, cor: "hsl(var(--success))", label: "Ao vivo" },
  accepted: { icon: <Handshake className="h-3 w-3" />, cor: "hsl(var(--info))", label: "Aceito" },
  pending: { icon: <UserPlus className="h-3 w-3" />, cor: "hsl(var(--warning))", label: "Pendente" },
  finished: { icon: <Trophy className="h-3 w-3" />, cor: "hsl(var(--primary))", label: "Finalizado" },
  declined: { icon: <Flag className="h-3 w-3" />, cor: "hsl(var(--muted-foreground))", label: "Recusado" },
};

function DuelRow({ duel }: { duel: Duel }) {
  const nomeA = resolveParticipantName(duel.challenger);
  const nomeB = resolveParticipantName(duel.challenged);
  const cfg = statusConfig[duel.status] || statusConfig.pending;
  const isLive = duel.status === "live" || duel.status === "accepted";

  const { data: contagem } = useContagemCorridasDuelo(
    isLive ? duel : null
  );

  const scoreA = isLive && contagem ? contagem.challengerRides : duel.challenger_rides_count;
  const scoreB = isLive && contagem ? contagem.challengedRides : duel.challenged_rides_count;

  return (
    <div
      className="flex items-center gap-3 rounded-lg p-2.5"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: duel.status === "live"
          ? "1px solid hsl(var(--success) / 0.4)"
          : "1px solid hsl(var(--border) / 0.5)",
      }}
    >
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cfg.cor}20`, color: cfg.cor }}
      >
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge
            variant="outline"
            className="text-[9px] gap-0.5 border-0 px-1.5 py-0"
            style={{ backgroundColor: `${cfg.cor}20`, color: cfg.cor }}
          >
            {cfg.label}
          </Badge>
          {duel.status === "live" && (
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "hsl(var(--success))" }} />
          )}
        </div>
        <p className="text-xs text-foreground truncate">
          {nomeA} vs {nomeB}
        </p>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {formatDistanceToNow(new Date(duel.created_at), { addSuffix: true, locale: ptBR })}
        </span>
      </div>

      {(duel.status === "live" || duel.status === "finished" || duel.status === "accepted") && (
        <span className="text-sm font-bold tabular-nums" style={{ color: cfg.cor }}>
          {scoreA} × {scoreB}
        </span>
      )}
    </div>
  );
}

export default function BranchDuelosAtivos({ branchId }: Props) {
  const { data: duelos = [] } = useDuelosCidade(branchId);

  const ativos = duelos.filter((d) => ["live", "accepted", "pending"].includes(d.status));
  const recentes = duelos.filter((d) => ["finished", "declined"].includes(d.status)).slice(0, 5);

  if (ativos.length === 0 && recentes.length === 0) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)" }}>
        <p className="text-xs text-muted-foreground text-center">Nenhum duelo na cidade ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Flame className="h-3.5 w-3.5" style={{ color: "hsl(var(--success))" }} />
        Duelos ({ativos.length} ativos)
      </h3>
      <div className="space-y-1.5">
        {ativos.map((d) => <DuelRow key={d.id} duel={d} />)}
        {recentes.map((d) => <DuelRow key={d.id} duel={d} />)}
      </div>
    </div>
  );
}
