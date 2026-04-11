import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

interface Props {
  data: { day: string; rides: number }[] | undefined;
  isLoading: boolean;
}

const chartConfig = {
  rides: {
    label: "Corridas",
    color: "hsl(var(--primary))",
  },
};

export default function BranchGraficoCorridasDia({ data, isLoading }: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <CardTitle className="text-sm font-medium">Corridas por dia (últimos 14 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="rides" fill="var(--color-rides)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
