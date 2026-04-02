import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiCorridas({ stats }: Props) {
  const items = [
    { label: "Total", value: stats.rides_total },
    { label: "Hoje", value: stats.rides_today },
    { label: "Este Mês", value: stats.rides_month },
    { label: "Média/Motorista", value: stats.rides_avg_per_driver },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Car className="h-4 w-4 text-blue-500" /> Corridas Realizadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xl font-bold">{item.value.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
