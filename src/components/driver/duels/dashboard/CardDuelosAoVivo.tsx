/**
 * Card para o dashboard mostrando duelos ao vivo na cidade.
 */
import { Swords, Flame, ChevronRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cleanDriverName, type Duel } from "../hook_duelos";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  duelos: Duel[];
  onAbrirArena?: (duel: Duel) => void;
  fontHeading?: string;
}

export default function CardDuelosAoVivo({ duelos, onAbrirArena, fontHeading }: Props) {
  const aoVivo = duelos.filter((d) => d.status === "live");
  const aceitos = duelos.filter((d) => d.status === "accepted");
  const ativos = [...aoVivo, ...aceitos];

  if (ativos.length === 0) return null;

  const destaque = ativos[0];
  const nomeA = cleanDriverName(destaque.challenger?.public_nickname || (destaque.challenger as any)?.customers?.name);
  const nomeB = cleanDriverName(destaque.challenged?.public_nickname || (destaque.challenged as any)?.customers?.name);
  const ridesA = destaque.challenger_rides_count;
  const ridesB = destaque.challenged_rides_count;
  const lider = ridesA > ridesB ? nomeA : ridesB > ridesA ? nomeB : null;
  const totalBet = (destaque.challenger_points_bet || 0) + (destaque.challenged_points_bet || 0);

  return (
    <div
      className="rounded-2xl p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: destaque.status === "live"
          ? "1px solid hsl(var(--success) / 0.4)"
          : "1px solid hsl(var(--border))",
        boxShadow: destaque.status === "live" ? "0 0 20px -8px hsl(var(--success) / 0.2)" : "none",
      }}
      onClick={() => onAbrirArena?.(destaque)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
          >
            <Swords className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground" style={{ fontFamily: fontHeading }}>
              Duelos ao vivo
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {ativos.length} duelo{ativos.length !== 1 ? "s" : ""} rolando
            </span>
          </div>
        </div>
        {aoVivo.length > 0 && (
          <Badge className="text-[9px] gap-1 animate-pulse" style={{ backgroundColor: "hsl(var(--success))", color: "white" }}>
            <Flame className="w-3 h-3" /> AO VIVO
          </Badge>
        )}
      </div>

      {/* Destaque principal */}
      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground truncate">{nomeA}</span>
            <span className="text-xs text-muted-foreground">vs</span>
            <span className="text-sm font-bold text-foreground truncate">{nomeB}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-black tabular-nums" style={{ color: "hsl(var(--primary))" }}>
              {ridesA} × {ridesB}
            </span>
            {totalBet > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {formatPoints(totalBet)} pts
              </span>
            )}
          </div>
          {lider && (
            <div className="flex items-center gap-1 mt-1">
              <Crown className="h-3 w-3" style={{ color: "hsl(var(--warning))" }} />
              <span className="text-[10px] font-medium" style={{ color: "hsl(var(--warning))" }}>
                {lider} na frente
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}
