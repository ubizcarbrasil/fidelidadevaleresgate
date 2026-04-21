import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Sparkles, Package } from "lucide-react";
import type { KpisLeads } from "../utils/utilitarios_kpis";

interface BlocoKpisLeadsProps {
  kpis: KpisLeads;
}

export default function BlocoKpisLeads({ kpis }: BlocoKpisLeadsProps) {
  const cards = [
    {
      label: "Leads no mês",
      valor: kpis.totalNoMes.toLocaleString("pt-BR"),
      sub: `${kpis.totalGeral} no total`,
      icon: Users,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Novos para contatar",
      valor: kpis.novos.toLocaleString("pt-BR"),
      sub: "status = novo",
      icon: Sparkles,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Taxa de conversão",
      valor: `${kpis.taxaConversao.toFixed(1)}%`,
      sub: `${kpis.convertidos} convertidos`,
      icon: TrendingUp,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Produto líder",
      valor: kpis.porProduto[0]?.produto ?? "—",
      sub: kpis.porProduto[0]
        ? `${kpis.porProduto[0].total} leads`
        : "Sem dados ainda",
      icon: Package,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="overflow-hidden">
          <CardContent className="p-5 flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.tone}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {c.label}
              </p>
              <p className="text-2xl font-bold mt-1 truncate" title={c.valor}>
                {c.valor}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{c.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
