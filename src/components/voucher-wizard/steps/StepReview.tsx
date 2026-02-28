import { VoucherWizardData } from "../VoucherWizard";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: VoucherWizardData;
  branches: any[];
}

export default function StepReview({ data, branches }: Props) {
  const branch = branches.find((b) => b.id === data.branch_id);
  const discountLabel =
    data.discount_type === "PERCENT"
      ? `${data.discount_percent}%`
      : data.discount_type === "FIXED"
      ? `R$ ${data.discount_fixed_value}`
      : "Frete Grátis";

  const rows: [string, string][] = [
    ["Tipo", data.discount_type === "PERCENT" ? "Percentual" : data.discount_type === "FIXED" ? "Valor Fixo" : "Frete Grátis"],
    ["Desconto", discountLabel],
    ["Código", data.code],
    ["Título", data.title],
    ["Descrição", data.description || "—"],
    ["Campanha", data.campaign || "—"],
    ["Filial", branch ? `${branch.name} (${(branch.brands as any)?.name})` : "—"],
    ["Início", data.start_at ? new Date(data.start_at).toLocaleString("pt-BR") : "Imediato"],
    ["Expiração", data.expires_at ? new Date(data.expires_at).toLocaleString("pt-BR") : "Sem limite"],
    ["Máx. usos", data.max_uses],
    ["Máx. por cliente", data.max_uses_per_customer],
    ["Compra mínima", `R$ ${data.min_purchase}`],
    ["Público", data.target_audience === "ALL" ? "Todos" : `${data.customer_name || "—"} / ${data.customer_email || "—"}`],
    ["Público", data.is_public ? "Sim" : "Não"],
    ["Termos", data.terms ? `${data.terms.slice(0, 80)}...` : "—"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold">Revisão Final</h3>
        <Badge variant="outline">{data.code}</Badge>
      </div>
      <div className="divide-y rounded-lg border">
        {rows.map(([label, value], i) => (
          <div key={i} className="flex justify-between px-4 py-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
