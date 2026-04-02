import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiPontuacao({ stats }: Props) {
  const items = [
    { label: "Total Distribuído", value: stats.points_total },
    { label: "Hoje", value: stats.points_today },
    { label: "Este Mês", value: stats.points_month },
    { label: "Média/Motorista", value: stats.points_avg_per_driver },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-500" /> Pontuação Motorista
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xl font-bold">{formatPoints(item.value)}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
