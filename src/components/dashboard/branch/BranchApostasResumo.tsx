/**
 * Resumo de apostas (side bets) da cidade para o painel admin.
 */
import { Coins, TrendingUp, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BranchDuelosStats } from "./hook_branch_duelos";

interface Props {
  stats: BranchDuelosStats;
}

export default function BranchApostasResumo({ stats }: Props) {
  const temApostas = stats.apostasAbertas > 0 || stats.apostasMatched > 0 || stats.bonusDistribuido > 0;

  if (!temApostas) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Coins className="h-3.5 w-3.5" style={{ color: "hsl(var(--warning))" }} />
        Apostas entre Espectadores
      </h3>

      <div
        className="rounded-xl p-3 space-y-2"
        style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)" }}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{stats.apostasAbertas}</p>
            <p className="text-[10px] text-muted-foreground">Abertas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stats.apostasMatched}</p>
            <p className="text-[10px] text-muted-foreground">Fechadas</p>
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: "hsl(var(--warning))" }}>
              {stats.pontosEmEscrow.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
              <Lock className="h-2.5 w-2.5" /> Escrow
            </p>
          </div>
        </div>

        {stats.bonusDistribuido > 0 && (
          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: "hsl(var(--success) / 0.1)" }}>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" style={{ color: "hsl(var(--success))" }} />
              Bônus 10% distribuído (mês)
            </span>
            <Badge variant="outline" className="text-[10px] border-0" style={{ backgroundColor: "hsl(var(--success) / 0.2)", color: "hsl(var(--success))" }}>
              +{stats.bonusDistribuido.toLocaleString("pt-BR")} pts
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
