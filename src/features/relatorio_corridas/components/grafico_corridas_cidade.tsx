import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { RelatorioCidadeRow } from "../types/tipos_relatorio_corridas";

interface Props {
  rows: RelatorioCidadeRow[];
}

export default function GraficoCorridasCidade({ rows }: Props) {
  const chartData = rows
    .filter((r) => r.total_rides > 0)
    .slice(0, 10)
    .map((r) => ({
      cidade: r.branch_city.length > 12 ? r.branch_city.slice(0, 12) + "…" : r.branch_city,
      mesAtual: r.rides_current_month,
      mesAnterior: r.rides_prev_month,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Corridas por Cidade — Comparativo Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="cidade" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(value: any, name: any) => [
                  Number(value).toLocaleString("pt-BR"),
                  name === "mesAtual" ? "Mês Atual" : "Mês Anterior",
                ]}
              />
              <Legend
                formatter={(value: string) => (value === "mesAtual" ? "Mês Atual" : "Mês Anterior")}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="mesAnterior" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mesAtual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
