import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { GgByMonthRow } from "@/compartilhados/hooks/hook_relatorios_ganha_ganha";

type Props = {
  rows: GgByMonthRow[];
  loading: boolean;
  year: number;
};

export function GraficoTemporalGg({ rows, loading, year }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Faturamento mensal — {year}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) =>
                    "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                  }
                />
                <Legend />
                <Bar dataKey="earn_fee" name="Geração" fill="hsl(var(--primary))" />
                <Bar dataKey="redeem_fee" name="Resgate" fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
