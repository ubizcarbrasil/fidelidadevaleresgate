import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Clock, CheckCircle, Truck, Package, XCircle } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";
import type { BranchDashboardStats } from "./tipos_branch_dashboard";

interface Props {
  stats: BranchDashboardStats;
}

export default function BranchKpiResgates({ stats }: Props) {
  const items = [
    { label: "Total", value: stats.redemptions_total, icon: ShoppingBag, color: "text-primary" },
    { label: "Pendentes", value: stats.redemptions_pending, icon: Clock, color: "text-amber-500" },
    { label: "Aprovados", value: stats.redemptions_approved, icon: CheckCircle, color: "text-green-500" },
    { label: "Enviados", value: stats.redemptions_shipped, icon: Truck, color: "text-blue-500" },
    { label: "Entregues", value: stats.redemptions_delivered, icon: Package, color: "text-emerald-500" },
    { label: "Rejeitados", value: stats.redemptions_rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">🎁 Resgates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {items.map((item) => (
            <div key={item.label} className="text-center space-y-1">
              <item.icon className={`h-4 w-4 mx-auto ${item.color}`} />
              <p className="text-lg font-bold">{item.value.toLocaleString("pt-BR")}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
