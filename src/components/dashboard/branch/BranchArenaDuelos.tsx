/**
 * Seção orquestradora da Arena Competitiva no painel da cidade.
 */
import { Swords, Target, CheckCircle, Coins, Lock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchDuelosStats } from "./hook_branch_duelos";
import BranchDuelosAtivos from "./BranchDuelosAtivos";
import BranchApostasResumo from "./BranchApostasResumo";
import BranchRankingCompetitivo from "./BranchRankingCompetitivo";
import BranchFeedDuelos from "./BranchFeedDuelos";

interface Props {
  branchId: string;
}

function KpiMini({ icon, label, value, cor }: { icon: React.ReactNode; label: string; value: string | number; cor: string }) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-2.5"
      style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)" }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cor}20`, color: cor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function BranchArenaDuelos({ branchId }: Props) {
  const { data: stats, isLoading } = useBranchDuelosStats(branchId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const temDados = stats.duelosAtivos > 0 || stats.duelosFinalizadosMes > 0 || stats.apostasAbertas > 0 || stats.apostasMatched > 0;

  if (!temDados) return null;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div
        className="rounded-xl p-3 flex items-center gap-2"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
          border: "1px solid hsl(var(--primary) / 0.3)",
        }}
      >
        <Swords className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
        <h2 className="text-sm font-bold text-foreground">Arena Competitiva da Cidade</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiMini
          icon={<Target className="h-4 w-4" />}
          label="Duelos Ativos"
          value={stats.duelosAtivos}
          cor="hsl(var(--success))"
        />
        <KpiMini
          icon={<CheckCircle className="h-4 w-4" />}
          label="Finalizados (mês)"
          value={stats.duelosFinalizadosMes}
          cor="hsl(var(--primary))"
        />
        <KpiMini
          icon={<Coins className="h-4 w-4" />}
          label="Apostas Ativas"
          value={stats.apostasAbertas + stats.apostasMatched}
          cor="hsl(var(--warning))"
        />
        <KpiMini
          icon={<Lock className="h-4 w-4" />}
          label="Pontos em Escrow"
          value={stats.pontosEmEscrow.toLocaleString("pt-BR")}
          cor="hsl(var(--info))"
        />
      </div>

      {/* Duelos + Ranking lado a lado em telas maiores */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BranchDuelosAtivos branchId={branchId} />
        <BranchRankingCompetitivo branchId={branchId} />
      </div>

      {/* Apostas */}
      <BranchApostasResumo stats={stats} />

      {/* Feed */}
      <BranchFeedDuelos branchId={branchId} />
    </div>
  );
}
