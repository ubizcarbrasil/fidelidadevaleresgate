import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmContactStats, useCrmEventStats, useTierDistribution } from "@/modules/crm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function CrmAnalyticsPage() {
  const { data: contactStats, isLoading: loadingContacts } = useCrmContactStats();
  const { data: eventStats, isLoading: loadingEvents } = useCrmEventStats();
  const { data: tierDist, isLoading: loadingTiers } = useTierDistribution();

  const isLoading = loadingContacts || loadingEvents || loadingTiers;

  const sourceData = Object.entries(contactStats?.bySource || {}).map(([name, value]) => ({ name, value }));
  const genderData = Object.entries(contactStats?.byGender || {}).map(([name, value]) => ({
    name: name === "M" ? "Masculino" : name === "F" ? "Feminino" : "Outro",
    value,
  }));
  const osData = Object.entries(contactStats?.byOS || {}).map(([name, value]) => ({ name, value }));
  const eventTypeData = Object.entries(eventStats?.byType || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics CRM" description="Visão avançada de contatos, eventos e engajamento" />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-3xl font-bold">{contactStats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Contatos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-3xl font-bold">{eventStats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Eventos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-3xl font-bold">{Object.keys(eventStats?.byType || {}).length}</p>
                <p className="text-sm text-muted-foreground">Tipos de Evento</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Contatos por Origem</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Contatos por Gênero</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sistema Operacional</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={osData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top Tipos de Evento</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeData} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {tierDist && tierDist.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição por Tier</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tierDist}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => [v, "Contatos"]} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {tierDist.map((t) => <Cell key={t.name} fill={t.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
