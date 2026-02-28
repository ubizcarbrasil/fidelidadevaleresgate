import { VoucherWizardData } from "../VoucherWizard";
import { Label } from "@/components/ui/label";
import { Percent, DollarSign, Truck } from "lucide-react";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

const TYPES = [
  { value: "PERCENT", label: "Percentual (%)", icon: Percent, desc: "Desconto em % sobre o valor" },
  { value: "FIXED", label: "Valor Fixo (R$)", icon: DollarSign, desc: "Abatimento em reais" },
  { value: "FREE_SHIPPING", label: "Frete Grátis", icon: Truck, desc: "Isenta o custo de entrega" },
];

export default function StepDiscountType({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Qual o tipo de desconto?</Label>
      <div className="grid gap-3">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = data.discount_type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => update({ discount_type: t.value })}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className={`p-2 rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{t.label}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
