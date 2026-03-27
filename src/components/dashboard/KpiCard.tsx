import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface KpiCardProps {
  title: string;
  value: any;
  sub?: string;
  icon: any;
  trend?: number;
  color?: string;
  sparkData?: number[];
}

const colorMap: Record<string, { text: string; bg: string; stroke: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/10", stroke: "hsl(217 91% 60%)" },
  success: { text: "text-success", bg: "bg-success/10", stroke: "hsl(142 71% 45%)" },
  warning: { text: "text-warning", bg: "bg-warning/10", stroke: "hsl(38 92% 50%)" },
  destructive: { text: "text-destructive", bg: "bg-destructive/10", stroke: "hsl(0 84% 60%)" },
  violet: { text: "text-purple-400", bg: "bg-purple-500/10", stroke: "hsl(270 60% 60%)" },
};

const KpiCard = memo(function KpiCard({ title, value, sub, icon: Icon, trend, color = "primary", sparkData }: KpiCardProps) {
  const c = colorMap[color] || colorMap.primary;

  return (
    <Card className="saas-kpi overflow-hidden relative">
      <CardContent className="p-5">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            {value === undefined ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {trend !== undefined && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
              {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
            </div>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${c.text} ${c.bg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-40">
            <ResponsiveContainer width="100%" height={48} minWidth={0} minHeight={0}>
              <AreaChart data={sparkData.map((v, i) => ({ v, i }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c.stroke} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={c.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={c.stroke} fill={`url(#spark-${color})`} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default KpiCard;
