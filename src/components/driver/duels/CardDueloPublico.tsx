import { useEffect, useState } from "react";
import { Flame, Clock, Trophy, User, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { resolveParticipantName, resolveParticipantAvatar, type Duel } from "./hook_duelos";

interface Props {
  duelo: Duel;
  onOpenArena?: (duel: Duel) => void;
}

function tempoRestante(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function AvatarMini({ nome, avatarUrl }: { nome: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={nome} className="w-9 h-9 rounded-full object-cover shrink-0" />;
  }
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
      {iniciais || <User className="w-4 h-4" />}
    </div>
  );
}

export default function CardDueloPublico({ duelo, onOpenArena }: Props) {
  const [, setTick] = useState(0);

  const aoVivo = duelo.status === "live";
  const encerrado = duelo.status === "finished";
  const agendado = duelo.status === "accepted" || duelo.status === "pending";

  // Tick a cada 30s para atualizar countdown
  useEffect(() => {
    if (!aoVivo) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [aoVivo]);

  const nomeA = resolveParticipantName(duelo.challenger);
  const nomeB = resolveParticipantName(duelo.challenged);
  const avatarA = resolveParticipantAvatar(duelo.challenger);
  const avatarB = resolveParticipantAvatar(duelo.challenged);

  const ridesA = duelo.challenger_rides_count;
  const ridesB = duelo.challenged_rides_count;
  const aFrente = ridesA > ridesB ? "A" : ridesB > ridesA ? "B" : null;

  const vencedorId = duelo.winner_id;
  const vencedorA = encerrado && vencedorId === duelo.challenger_id;
  const vencedorB = encerrado && vencedorId === duelo.challenged_id;
  const empate = encerrado && !vencedorId;

  return (
    <button
      onClick={() => (aoVivo || encerrado) && onOpenArena?.(duelo)}
      className={`relative flex flex-col gap-2 rounded-xl border p-3 min-w-[260px] max-w-[280px] snap-start shrink-0 bg-card text-left transition-all ${
        aoVivo ? "border-green-500/60 shadow-[0_0_12px_-3px_rgba(34,197,94,0.35)]" : "border-border"
      } ${(aoVivo || encerrado) ? "active:scale-[0.98] cursor-pointer" : ""}`}
    >
      {/* Badge status */}
      <div className="flex items-center justify-between">
        {aoVivo && (
          <Badge className="bg-green-600 text-white text-[10px] gap-1 animate-pulse">
            <Flame className="w-3 h-3" /> Ao Vivo
          </Badge>
        )}
        {agendado && (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Clock className="w-3 h-3" /> Agendado
          </Badge>
        )}
        {encerrado && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Trophy className="w-3 h-3" /> Encerrado
          </Badge>
        )}

        {aoVivo && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {tempoRestante(duelo.end_at)}
          </span>
        )}
      </div>

      {/* Placar */}
      <div className="flex items-center justify-between gap-2">
        {/* Motorista A */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <AvatarMini nome={nomeA} avatarUrl={avatarA} />
          <span className="text-[11px] font-medium text-foreground truncate w-full text-center">
            {nomeA}
          </span>
          <span
            className={`text-xl font-black tabular-nums ${
              vencedorA
                ? "text-green-500"
                : aFrente === "A" && aoVivo
                ? "text-green-400"
                : "text-foreground"
            }`}
          >
            <AnimatedCounter value={ridesA} />
          </span>
          {aoVivo && aFrente === "A" && (
            <Badge className="bg-green-600/20 text-green-400 text-[9px] border-green-600/30">
              na frente
            </Badge>
          )}
          {vencedorA && (
            <Badge className="bg-yellow-500/20 text-yellow-400 text-[9px] border-yellow-500/30">
              🏆 Vencedor
            </Badge>
          )}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-0.5">
          <Swords className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground">VS</span>
        </div>

        {/* Motorista B */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <AvatarMini nome={nomeB} avatarUrl={avatarB} />
          <span className="text-[11px] font-medium text-foreground truncate w-full text-center">
            {nomeB}
          </span>
          <span
            className={`text-xl font-black tabular-nums ${
              vencedorB
                ? "text-green-500"
                : aFrente === "B" && aoVivo
                ? "text-green-400"
                : "text-foreground"
            }`}
          >
            <AnimatedCounter value={ridesB} />
          </span>
          {aoVivo && aFrente === "B" && (
            <Badge className="bg-green-600/20 text-green-400 text-[9px] border-green-600/30">
              na frente
            </Badge>
          )}
          {vencedorB && (
            <Badge className="bg-yellow-500/20 text-yellow-400 text-[9px] border-yellow-500/30">
              🏆 Vencedor
            </Badge>
          )}
        </div>
      </div>

      {empate && (
        <p className="text-center text-[10px] text-muted-foreground">Empate! 🤝</p>
      )}

      {/* Rodapé: corridas label + CTA assistir */}
      <div className="flex items-center justify-between mt-auto">
        <p className="text-[10px] text-muted-foreground">
          corridas concluídas
        </p>
        {aoVivo && (
          <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "hsl(var(--success))" }}>
            👁️ Assistir ao vivo
          </span>
        )}
        {encerrado && (
          <span className="text-[10px] font-bold flex items-center gap-1 text-muted-foreground">
            📊 Ver resultado
          </span>
        )}
      </div>
    </button>
  );
}
