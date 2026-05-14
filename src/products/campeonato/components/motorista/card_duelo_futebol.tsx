import { useEffect, useState } from "react";
import { Crown, MapPin, Radio } from "lucide-react";
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

/** Progresso do duelo (0..1) baseado em starts_at → ends_at. */
function progressoDuelo(startsAt: string, endsAt: string): number {
  const ini = new Date(startsAt).getTime();
  const fim = new Date(endsAt).getTime();
  const agora = Date.now();
  if (agora <= ini) return 0;
  if (agora >= fim) return 1;
  return (agora - ini) / (fim - ini);
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

  const ladoAOpaco = encerrado && !venceuA;
  const ladoBOpaco = encerrado && !venceuB;

  const progresso =
    status === "em_andamento"
      ? progressoDuelo(confronto.starts_at, confronto.ends_at)
      : encerrado
        ? 1
        : 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 bg-card shadow-xl ${
        status === "em_andamento"
          ? "border-primary neon-glow"
          : encerrado
            ? "border-border/60"
            : "border-primary/30"
      }`}
    >
      {/* Faixa superior preta — estilo scorebug SporTV */}
      <div className="scorebug-bar flex items-center justify-between px-3 py-1.5 text-[10px] font-condensed-camp font-bold uppercase tracking-[0.18em]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="tabular-nums opacity-80">
            {formatarDataHora(confronto.starts_at)}
          </span>
          {arenaNome && (
            <span className="flex items-center gap-1 truncate opacity-80">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{arenaNome}</span>
            </span>
          )}
        </div>
        <BadgeStatus status={status} endsAt={confronto.ends_at} />
      </div>

      {/* Corpo principal — A | PLACAR | B */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-4">
        <LadoMotorista
          nome={confronto.driver_a_name}
          photo={confronto.driver_a_photo_url}
          isMe={isMeA}
          venceu={venceuA}
          opaco={ladoAOpaco}
        />

        <div className="flex flex-col items-center gap-0 px-1">
          <div className="flex items-end gap-1.5">
            <span
              className={`font-display-camp tabular-nums leading-none ${
                venceuA ? "text-[hsl(var(--gold))]" : "text-foreground"
              } ${ladoAOpaco ? "opacity-50" : ""}`}
              style={{ fontSize: "3.25rem" }}
            >
              {confronto.driver_a_rides}
            </span>
            <span className="font-display-camp text-2xl text-primary/70 leading-none pb-1">
              ×
            </span>
            <span
              className={`font-display-camp tabular-nums leading-none ${
                venceuB ? "text-[hsl(var(--gold))]" : "text-foreground"
              } ${ladoBOpaco ? "opacity-50" : ""}`}
              style={{ fontSize: "3.25rem" }}
            >
              {confronto.driver_b_rides}
            </span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">
            corridas
          </p>
        </div>

        <LadoMotorista
          nome={confronto.driver_b_name}
          photo={confronto.driver_b_photo_url}
          isMe={isMeB}
          venceu={venceuB}
          opaco={ladoBOpaco}
        />
      </div>

      {/* Barra de progresso do duelo (24h) */}
      <div className="h-1.5 w-full bg-secondary/60 relative overflow-hidden">
        <div
          className="duel-progress h-full transition-all"
          style={{ width: `${Math.round(progresso * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ───────────── Lado do motorista (foto grande + nome) ───────────── */

function LadoMotorista({
  nome,
  photo,
  isMe,
  venceu,
  opaco,
}: {
  nome: string | null;
  photo: string | null;
  isMe: boolean;
  venceu: boolean;
  opaco: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all ${
        opaco ? "opacity-50 grayscale" : ""
      }`}
    >
      <div className={`relative rounded-full ${venceu ? "gold-halo" : ""}`}>
        <AvatarMotorista nome={nome} url={photo} size={72} />
        {venceu && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[hsl(var(--gold))] rounded-full p-0.5 shadow-md">
            <Crown className="h-3 w-3 text-[hsl(var(--gold-foreground))]" />
          </div>
        )}
      </div>
      <p
        className={`text-[11px] text-center truncate w-full uppercase tracking-wide ${
          isMe
            ? "font-display-camp text-base text-primary"
            : venceu
              ? "font-bold text-foreground"
              : "font-semibold text-foreground/90"
        }`}
      >
        {isMe ? "VOCÊ" : (nome ?? "—")}
      </p>
    </div>
  );
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
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-destructive text-destructive-foreground text-[9px] font-bold animate-pulse">
          <Radio className="h-2.5 w-2.5" />
          AO VIVO
        </span>
        <span className="tabular-nums text-[10px] text-primary font-bold">
          {formatarTempoRestante(endsAt)}
        </span>
      </span>
    );
  }
  if (status === "encerrado") {
    return (
      <span className="text-[10px] font-bold text-muted-foreground">
        ENCERRADO
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold text-primary/80">AGUARDANDO</span>
  );
}