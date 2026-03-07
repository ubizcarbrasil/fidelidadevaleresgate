import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTierDistribution } from "@/hooks/useTierStats";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users } from "lucide-react";

export default function CrmTierPage() {
  const { data: distribution, isLoading } = useTierDistribution();

  const totalContacts = distribution?.reduce((sum, t) => sum + t.count, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Tiers de Engajamento" description="Distribuição de contatos por nível de atividade" />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          {/* Tier cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {distribution?.map((tier) => (
              <Card key={tier.name} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: tier.color }} />
                <CardContent className="pt-4 pb-3 pl-5">
                  <p className="text-2xl font-bold">{tier.count}</p>
                  <p className="text-sm font-medium" style={{ color: tier.color }}>{tier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tier.max_events === null
                      ? `${tier.min_events}+ eventos`
                      : tier.min_events === 0 && tier.max_events === 0
                        ? "0 eventos"
                        : `${tier.min_events}-${tier.max_events} eventos`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary card */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">{totalContacts}</span>
                <span className="text-muted-foreground">contatos classificados</span>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution || []} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip
                      formatter={(value: number) => [value, "Contatos"]}
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {distribution?.map((tier) => (
                        <Cell key={tier.name} fill={tier.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
