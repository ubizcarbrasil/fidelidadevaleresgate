/**
 * Seção de palpites sociais exibida na Arena ao Vivo.
 */
import { Users, ThumbsUp, Check } from "lucide-react";
import { motion } from "framer-motion";
import { usePalpitesDuelo } from "./hook_palpites_duelo";
import { cleanDriverName, type Duel } from "./hook_duelos";

interface Props {
  duel: Duel;
}

export default function PalpitesDuelo({ duel }: Props) {
  const challengerId = duel.challenger_id;
  const challengedId = duel.challenged_id;

  const {
    meuPalpite,
    totalPalpites,
    getContagem,
    getPercentual,
    registrarPalpite,
    isPending,
  } = usePalpitesDuelo(duel.id);

  const nomeA = cleanDriverName(
    duel.challenger?.public_nickname || (duel.challenger as any)?.customers?.name
  );
  const nomeB = cleanDriverName(
    duel.challenged?.public_nickname || (duel.challenged as any)?.customers?.name
  );

  const pctA = getPercentual(challengerId);
  const pctB = getPercentual(challengedId);
  const cntA = getContagem(challengerId);
  const cntB = getContagem(challengedId);

  const jaVotou = !!meuPalpite;
  const aoVivo = duel.status === "live" || duel.status === "accepted";

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
        <span className="text-xs font-bold text-foreground">Palpites da cidade</span>
        {totalPalpites > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {totalPalpites} palpite{totalPalpites !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Barra visual de proporção */}
      {totalPalpites > 0 && (
        <div className="space-y-1.5">
          <div
            className="flex h-2.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "hsl(var(--muted))" }}
          >
            <motion.div
              className="rounded-l-full"
              initial={false}
              animate={{ width: `${pctA}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              style={{ backgroundColor: "hsl(var(--primary))" }}
            />
            <motion.div
              className="rounded-r-full"
              initial={false}
              animate={{ width: `${pctB}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              style={{ backgroundColor: "hsl(var(--warning))" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{pctA}% ({cntA})</span>
            <span>({cntB}) {pctB}%</span>
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
            cor="hsl(var(--primary))"
          />
          <BotaoPalpite
            nome={nomeB}
            selecionado={meuPalpite === challengedId}
            jaVotou={jaVotou}
            loading={isPending}
            onClick={() => registrarPalpite(challengedId)}
            cor="hsl(var(--warning))"
          />
        </div>
      )}

      {totalPalpites === 0 && aoVivo && !jaVotou && (
        <p className="text-[11px] text-muted-foreground text-center">
          Seja o primeiro a dar seu palpite! 🎯
        </p>
      )}

      {jaVotou && (
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Check className="h-3 w-3" style={{ color: "hsl(var(--success))" }} />
          Você já registrou seu palpite
        </p>
      )}
    </div>
  );
}

/* ─── Botão individual ─── */
function BotaoPalpite({
  nome,
  selecionado,
  jaVotou,
  loading,
  onClick,
  cor,
}: {
  nome: string;
  selecionado: boolean;
  jaVotou: boolean;
  loading: boolean;
  onClick: () => void;
  cor: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || (jaVotou && !selecionado)}
      className="rounded-lg px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
      style={{
        backgroundColor: selecionado ? cor : "hsl(var(--muted))",
        color: selecionado ? "white" : "hsl(var(--foreground))",
        border: selecionado ? `2px solid ${cor}` : "2px solid transparent",
      }}
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      <span className="truncate max-w-[80px]">{nome}</span>
    </button>
  );
}
