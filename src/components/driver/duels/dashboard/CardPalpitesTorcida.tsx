/**
 * Card de palpites / torcida para o dashboard.
 */
import { Users, ChevronRight, MessageCircle } from "lucide-react";
import { type Duel } from "../hook_duelos";
import { cleanDriverName } from "../hook_duelos";

interface Props {
  duelos: Duel[];
  onAbrirArena?: (duel: Duel) => void;
  fontHeading?: string;
}

export default function CardPalpitesTorcida({ duelos, onAbrirArena, fontHeading }: Props) {
  const ativos = duelos.filter((d) => d.status === "live" || d.status === "accepted");
  if (ativos.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(280 60% 55% / 0.12)" }}>
          <Users className="h-4 w-4" style={{ color: "hsl(280 60% 55%)" }} />
        </div>
        <div>
          <span className="text-xs font-bold text-foreground" style={{ fontFamily: fontHeading }}>
            Palpites & Torcida
          </span>
          <span className="text-[10px] text-muted-foreground block">
            {ativos.length} disputa{ativos.length !== 1 ? "s" : ""} para dar palpite
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {ativos.slice(0, 3).map((d) => {
          const nA = cleanDriverName(d.challenger?.public_nickname || (d.challenger as any)?.customers?.name);
          const nB = cleanDriverName(d.challenged?.public_nickname || (d.challenged as any)?.customers?.name);
          return (
            <div
              key={d.id}
              className="flex items-center gap-2 rounded-lg p-2.5 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
              onClick={() => onAbrirArena?.(d)}
            >
              <MessageCircle className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(280 60% 55%)" }} />
              <span className="text-xs text-foreground flex-1 truncate">
                <b>{nA}</b> vs <b>{nB}</b>
              </span>
              <span className="text-[10px] font-medium" style={{ color: "hsl(var(--primary))" }}>
                {d.challenger_rides_count} × {d.challenged_rides_count}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        🎯 Dê seu palpite e acompanhe a disputa!
      </p>
    </div>
  );
}
