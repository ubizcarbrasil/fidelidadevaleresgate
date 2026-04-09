import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCircle, XCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useRelatorioMensagens } from "../hooks/hook_relatorio_mensagens";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  brandId: string;
}

const CORES_STATUS = {
  enviadas: "hsl(var(--chart-2))",
  falhas: "hsl(var(--destructive))",
  ignoradas: "hsl(var(--muted-foreground))",
};

const CORES_PIE = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const LABELS_EVENTO: Record<string, string> = {
  MANUAL_BROADCAST: "Envio Manual",
  DUEL_CHALLENGE_RECEIVED: "Desafio Recebido",
  DUEL_ACCEPTED: "Desafio Aceito",
  DUEL_DECLINED: "Desafio Recusado",
  DUEL_VICTORY: "Vitória Duelo",
  DUEL_FINISHED: "Duelo Finalizado",
  BELT_NEW_CHAMPION: "Novo Campeão",
  DUEL_COUNTER_PROPOSAL: "Contraproposta",
  DUEL_STARTED: "Duelo Iniciado",
  DUEL_LEAD_CHANGE: "Mudança Liderança",
  RANKING_TOP10_ENTRY: "Entrada Top 10",
};

function CardMetrica({
  titulo,
  valor,
  icone: Icone,
  cor,
  subtitulo,
}: {
  titulo: string;
  valor: string | number;
  icone: React.ElementType;
  cor: string;
  subtitulo?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${cor}`}>
          <Icone className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{valor}</p>
          <p className="text-xs text-muted-foreground">{titulo}</p>
          {subtitulo && <p className="text-[10px] text-muted-foreground/70">{subtitulo}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function RelatorioMensagens({ brandId }: Props) {
  const { resumo, porDia, porEvento, isLoading } = useRelatorioMensagens(brandId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const pieData = porEvento.map((e) => ({
    name: LABELS_EVENTO[e.evento] || e.evento,
    value: e.total,
  }));

  const chartData = porDia.map((d) => ({
    ...d,
    dia: d.dia.slice(5), // MM-DD
  }));

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardMetrica
          titulo="Total Enviadas"
          valor={resumo?.total ?? 0}
          icone={Send}
          cor="bg-primary/10 text-primary"
        />
        <CardMetrica
          titulo="Sucesso"
          valor={resumo?.enviadas ?? 0}
          icone={CheckCircle}
          cor="bg-green-500/10 text-green-500"
          subtitulo={`${resumo?.taxaSucesso ?? 0}% de sucesso`}
        />
        <CardMetrica
          titulo="Falhas"
          valor={resumo?.falhas ?? 0}
          icone={XCircle}
          cor="bg-destructive/10 text-destructive"
        />
        <CardMetrica
          titulo="Ignoradas"
          valor={resumo?.ignoradas ?? 0}
          icone={AlertTriangle}
          cor="bg-yellow-500/10 text-yellow-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart - sends per day */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Envios por Dia
            </CardTitle>
            <CardDescription className="text-xs">Volume diário de mensagens</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Nenhum dado disponível ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="enviadas" name="Enviadas" fill={CORES_STATUS.enviadas} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="falhas" name="Falhas" fill={CORES_STATUS.falhas} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ignoradas" name="Ignoradas" fill={CORES_STATUS.ignoradas} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart - by event type */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Tipo de Evento</CardTitle>
            <CardDescription className="text-xs">Distribuição por evento</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: 9 }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
