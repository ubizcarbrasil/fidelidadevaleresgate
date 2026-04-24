import { Card } from "@/components/ui/card";
import { Shield, Package, Layers, AlertTriangle } from "lucide-react";
import type { DiagnosticoCompleto } from "../types/tipos_diagnostico";

interface Props {
  diagnostico: DiagnosticoCompleto;
}

export default function CardResumoProduto({ diagnostico }: Props) {
  const cards = [
    {
      icon: Shield,
      label: "Núcleo",
      value: diagnostico.totalNucleo,
      hint: "Sempre ativos para qualquer produto",
      tone: "text-blue-500",
    },
    {
      icon: Package,
      label: "Produto",
      value: diagnostico.totalProduto,
      hint: "Vindos do template do plano contratado",
      tone: "text-emerald-500",
    },
    {
      icon: Layers,
      label: "Modelo de negócio",
      value: diagnostico.totalModeloNegocio,
      hint: "Vindos dos modelos vinculados à marca",
      tone: "text-violet-500",
    },
    {
      icon: AlertTriangle,
      label: "Override manual",
      value: diagnostico.totalManual,
      hint: "Ativados fora do produto — investigar",
      tone: diagnostico.totalManual > 0 ? "text-amber-500" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {c.label}
            </p>
            <c.icon className={`h-4 w-4 ${c.tone}`} />
          </div>
          <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {c.hint}
          </p>
        </Card>
      ))}
    </div>
  );
}