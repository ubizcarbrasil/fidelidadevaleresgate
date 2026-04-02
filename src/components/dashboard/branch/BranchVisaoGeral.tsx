import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import { Badge } from "@/components/ui/badge";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchVisaoGeral({ stats }: Props) {
  const isLowBalance = stats.wallet_balance <= stats.wallet_low_threshold;

  return (
    <Card className={isLowBalance ? "border-destructive/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Visão Geral da Cidade
          </CardTitle>
          {isLowBalance && (
            <Badge variant="destructive" className="gap-1 text-[10px]">
              <AlertTriangle className="h-3 w-3" /> Saldo Baixo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">Saldo Carteira</p>
            </div>
            <p className={`text-xl font-bold ${isLowBalance ? "text-destructive" : ""}`}>
              {formatPoints(stats.wallet_balance)} <span className="text-xs font-normal text-muted-foreground">pts</span>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <p className="text-xs text-muted-foreground">Total Carregado</p>
            </div>
            <p className="text-xl font-bold">{formatPoints(stats.wallet_total_loaded)} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <p className="text-xs text-muted-foreground">Total Distribuído</p>
            </div>
            <p className="text-xl font-bold">{formatPoints(stats.wallet_total_distributed)} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Regras Ativas</p>
            <p className="text-xl font-bold">{stats.active_rules}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="text-xl font-bold">
              {stats.wallet_total_loaded > 0
                ? `${Math.round((stats.wallet_balance / stats.wallet_total_loaded) * 100)}%`
                : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
