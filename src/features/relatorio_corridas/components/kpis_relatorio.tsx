import { Card, CardContent } from "@/components/ui/card";
import { Car, Coins, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  rides: number;
  value: number;
  driverPts: number;
  clientPts: number;
  drivers: number;
  currentMonth: number;
  prevMonth: number;
}

export default function KpisRelatorio({ rides, value, driverPts, clientPts, drivers, currentMonth, prevMonth }: Props) {
  const tendencia = prevMonth > 0 ? ((currentMonth - prevMonth) / prevMonth) * 100 : 0;
  const TrendIcon = tendencia > 0 ? TrendingUp : tendencia < 0 ? TrendingDown : Minus;
  const trendColor = tendencia > 0 ? "text-green-500" : tendencia < 0 ? "text-red-500" : "text-muted-foreground";

  const kpis = [
    { label: "Total de Corridas", value: rides.toLocaleString("pt-BR"), icon: Car, color: "text-primary" },
    { label: "Valor Total", value: `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Coins, color: "text-amber-500" },
    { label: "Pontos Motorista", value: driverPts.toLocaleString("pt-BR"), icon: Car, color: "text-blue-500" },
    { label: "Pontos Cliente", value: clientPts.toLocaleString("pt-BR"), icon: Users, color: "text-violet-500" },
    { label: "Motoristas Únicos", value: drivers.toLocaleString("pt-BR"), icon: Users, color: "text-emerald-500" },
    {
      label: "Tendência Mensal",
      value: `${tendencia >= 0 ? "+" : ""}${tendencia.toFixed(1)}%`,
      icon: TrendIcon,
      color: trendColor,
      subtitle: `${currentMonth.toLocaleString("pt-BR")} este mês vs ${prevMonth.toLocaleString("pt-BR")} anterior`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[11px] text-muted-foreground leading-tight">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold tracking-tight">{kpi.value}</p>
            {kpi.subtitle && <p className="text-[10px] text-muted-foreground">{kpi.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
