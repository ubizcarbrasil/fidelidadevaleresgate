import { useEffect, useState } from "react";
import { Crown, MapPin } from "lucide-react";
import { AvatarMotorista } from "../shared/AvatarMotorista";
import { statusDoConfronto } from "../../utils/utilitarios_chaveamento";
import { formatarTempoRestante } from "./utilitarios_motorista";
import type { ConfrontoListagem } from "../../types/tipos_tabela_duelos";

interface Props {
  confronto: ConfrontoListagem;
  driverIdLogado: string | null;
  arenaNome?: string | null;
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Card de duelo no estilo "time A × time B" inspirado em apps de futebol.
 * - Avatares 40px de cada lado
 * - Placar centralizado com × grande
 * - Badge AO VIVO pulsante quando em andamento
 * - Timer regressivo
 * - Vencedor destacado, perdedor opaco
 * - Lado do motorista logado em bold
 */
export default function CardDueloFutebol({
  confronto,
  driverIdLogado,
  arenaNome,
}: Props) {
  const status = statusDoConfronto({
    starts_at: confronto.starts_at,
    ends_at: confronto.ends_at,
    winner_id: confronto.winner_id,
  } as any);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (status !== "em_andamento") return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [status]);

  const isMeA = !!driverIdLogado && confronto.driver_a_id === driverIdLogado;
  const isMeB = !!driverIdLogado && confronto.driver_b_id === driverIdLogado;

  const venceuA = !!confronto.winner_id && confronto.winner_id === confronto.driver_a_id;
  const venceuB = !!confronto.winner_id && confronto.winner_id === confronto.driver_b_id;
  const encerrado = status === "encerrado";

  const ladoA = ladoClasses(isMeA, venceuA, encerrado);
  const ladoB = ladoClasses(isMeB, venceuB, encerrado);

  return (
    <div className="rounded-xl border border-primary/40 bg-card p-3 space-y-3 neon-glow">
      {/* Topo: data/hora + arena + status */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <span className="tabular-nums">{formatarDataHora(confronto.starts_at)}</span>
          {arenaNome && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{arenaNome}</span>
            </span>
          )}
        </div>
        <BadgeStatus status={status} endsAt={confronto.ends_at} />
      </div>

      {/* Corpo: A | placar | B */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Lado A */}
        <div className={`flex flex-col items-center gap-1.5 rounded-md py-2 px-1 ${ladoA}`}>
          <AvatarMotorista nome={confronto.driver_a_name} url={confronto.driver_a_photo_url} size={40} />
          <p className={`text-xs text-center truncate w-full ${isMeA ? "font-bold" : "font-medium"}`}>
            {isMeA ? "VOCÊ" : (confronto.driver_a_name ?? "—")}
          </p>
          {venceuA && <Crown className="h-3 w-3 text-primary" aria-label="Vencedor" />}
        </div>

        {/* Placar central */}
        <div className="flex items-center gap-1.5 px-2">
          <span className="text-2xl font-extrabold tabular-nums text-foreground">
            {confronto.driver_a_rides}
          </span>
          <span className="text-base font-bold text-muted-foreground">×</span>
          <span className="text-2xl font-extrabold tabular-nums text-foreground">
            {confronto.driver_b_rides}
          </span>
        </div>

        {/* Lado B */}
        <div className={`flex flex-col items-center gap-1.5 rounded-md py-2 px-1 ${ladoB}`}>
          <AvatarMotorista nome={confronto.driver_b_name} url={confronto.driver_b_photo_url} size={40} />
          <p className={`text-xs text-center truncate w-full ${isMeB ? "font-bold" : "font-medium"}`}>
            {isMeB ? "VOCÊ" : (confronto.driver_b_name ?? "—")}
          </p>
          {venceuB && <Crown className="h-3 w-3 text-primary" aria-label="Vencedor" />}
        </div>
      </div>

      {/* Linha "corridas" */}
      <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        corridas
      </p>
    </div>
  );
}

function ladoClasses(isMe: boolean, venceu: boolean, encerrado: boolean): string {
  if (encerrado && venceu) return "bg-primary/15";
  if (encerrado && !venceu) return "opacity-60";
  if (isMe) return "bg-muted/40";
  return "";
}

function BadgeStatus({
  status,
  endsAt,
}: {
  status: "aguardando" | "em_andamento" | "encerrado";
  endsAt: string;
}) {
  if (status === "em_andamento") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground text-[9px] font-bold animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" />
          AO VIVO
        </span>
        <span className="tabular-nums text-[10px] text-primary font-semibold">
          {formatarTempoRestante(endsAt)}
        </span>
      </span>
    );
  }
  if (status === "encerrado") {
    return <span className="text-[10px] font-semibold text-muted-foreground">ENCERRADO</span>;
  }
  return <span className="text-[10px] font-semibold text-muted-foreground">AGUARDANDO</span>;
}