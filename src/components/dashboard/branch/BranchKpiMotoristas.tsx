import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiMotoristas({ stats }: Props) {
  const items = [
    { label: "Cadastrados", value: stats.drivers_total },
    { label: "Pontuados", value: stats.drivers_scored },
    { label: "Já Resgataram", value: stats.drivers_redeemed },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-green-500" /> Motoristas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
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
