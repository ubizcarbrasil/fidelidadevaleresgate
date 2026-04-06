/**
 * Seção de palpites sociais — visual de torcida organizada na Arena.
 */
import { Users, ThumbsUp, Check, Target } from "lucide-react";
import { motion } from "framer-motion";
import { usePalpitesDuelo } from "./hook_palpites_duelo";
import { cleanDriverName, type Duel } from "./hook_duelos";

interface Props {
  duel: Duel;
}

export default function PalpitesDuelo({ duel }: Props) {
  const challengerId = duel.challenger_id;
  const challengedId = duel.challenged_id;

  const { meuPalpite, totalPalpites, getContagem, getPercentual, registrarPalpite, isPending } = usePalpitesDuelo(duel.id);

  const nomeA = cleanDriverName(duel.challenger?.public_nickname || (duel.challenger as any)?.customers?.name);
  const nomeB = cleanDriverName(duel.challenged?.public_nickname || (duel.challenged as any)?.customers?.name);

  const pctA = getPercentual(challengerId);
  const pctB = getPercentual(challengedId);
  const cntA = getContagem(challengerId);
  const cntB = getContagem(challengedId);

  const jaVotou = !!meuPalpite;
  const aoVivo = duel.status === "live" || duel.status === "accepted";

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{
        background: "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(280 60% 55% / 0.04) 100%)",
        border: "1px solid hsl(280 60% 55% / 0.15)",
      }}
    >
      {/* Decorative top line */}
      <div className="h-[2px]" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(280 60% 55%), hsl(var(--warning)))" }} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(280 60% 55% / 0.2), hsl(280 60% 55% / 0.08))" }}>
            <Target className="h-3.5 w-3.5" style={{ color: "hsl(280 60% 55%)" }} />
          </div>
          <span className="text-xs font-extrabold text-foreground tracking-tight">Palpites da cidade</span>
          {totalPalpites > 0 && (
            <span className="text-[10px] font-bold ml-auto px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(280 60% 55% / 0.12)", color: "hsl(280 60% 55%)" }}>
              {totalPalpites} 🎯
            </span>
          )}
        </div>

        {/* Barra visual com percentuais sobrepostos */}
        {totalPalpites > 0 && (
          <div className="space-y-1">
            <div className="flex h-8 rounded-lg overflow-hidden relative" style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}>
              <motion.div
                className="flex items-center justify-start pl-2 rounded-l-lg"
                initial={false}
                animate={{ width: `${Math.max(pctA, 15)}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
                style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.9))" }}
              >
                <span className="text-[11px] font-black text-white">{pctA}%</span>
              </motion.div>
              <motion.div
                className="flex items-center justify-end pr-2 rounded-r-lg"
                initial={false}
                animate={{ width: `${Math.max(pctB, 15)}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
                style={{ background: "linear-gradient(90deg, hsl(var(--destructive) / 0.6), hsl(var(--destructive) / 0.9))" }}
              >
                <span className="text-[11px] font-black text-white">{pctB}%</span>
              </motion.div>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground font-medium px-0.5">
              <span>{cntA} palpite{cntA !== 1 ? "s" : ""}</span>
              <span>{cntB} palpite{cntB !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Botões de votação */}
        {aoVivo && (
          <div className="grid grid-cols-2 gap-2">
            <BotaoPalpite
              nome={nomeA}
              selecionado={meuPalpite === challengerId}
              jaVotou={jaVotou}
              loading={isPending}
              onClick={() => registrarPalpite(challengerId)}
              gradiente="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))"
              corBase="hsl(var(--primary))"
            />
            <BotaoPalpite
              nome={nomeB}
              selecionado={meuPalpite === challengedId}
              jaVotou={jaVotou}
              loading={isPending}
              onClick={() => registrarPalpite(challengedId)}
              gradiente="linear-gradient(135deg, hsl(var(--destructive) / 0.8), hsl(var(--destructive) / 0.5))"
              corBase="hsl(var(--destructive))"
            />
          </div>
        )}

        {totalPalpites === 0 && aoVivo && !jaVotou && (
          <p className="text-[11px] text-muted-foreground text-center">
            🎯 Seja o primeiro a dar seu palpite! Quem leva essa?
          </p>
        )}

        {jaVotou && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <Check className="h-3.5 w-3.5" style={{ color: "hsl(var(--success))" }} />
            <span className="text-[10px] font-bold" style={{ color: "hsl(var(--success))" }}>
              Palpite registrado!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BotaoPalpite({
  nome,
  selecionado,
  jaVotou,
  loading,
  onClick,
  gradiente,
  corBase,
}: {
  nome: string;
  selecionado: boolean;
  jaVotou: boolean;
  loading: boolean;
  onClick: () => void;
  gradiente: string;
  corBase: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={loading || (jaVotou && !selecionado)}
      className="rounded-xl px-3 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
      style={{
        background: selecionado ? gradiente : "hsl(var(--muted) / 0.5)",
        color: selecionado ? "white" : "hsl(var(--foreground))",
        border: selecionado ? "none" : `1px solid hsl(var(--border))`,
        boxShadow: selecionado ? `0 4px 15px ${corBase.replace(")", " / 0.3)")}` : "none",
      }}
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      <span className="truncate max-w-[80px]">{nome}</span>
    </motion.button>
  );
}
