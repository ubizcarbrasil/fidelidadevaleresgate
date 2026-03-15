import { StoreVoucherData, OfferPurpose } from "../types";
import { Label } from "@/components/ui/label";
import { Coins, Gift, RefreshCw } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

const purposes: { value: OfferPurpose; label: string; description: string; icon: typeof Coins; color: string }[] = [
  {
    value: "EARN",
    label: "Ganhe Pontos",
    description: "O cliente acumula pontos pelo valor pago. Não troca pontos.",
    icon: Coins,
    color: "hsl(142 71% 45%)",
  },
  {
    value: "REDEEM",
    label: "Resgate",
    description: "O cliente usa pontos como meio de pagamento. Não acumula pontos.",
    icon: Gift,
    color: "hsl(45 93% 47%)",
  },
  {
    value: "BOTH",
    label: "Ganhe & Resgate",
    description: "Acumula pontos pelo valor pago em dinheiro E usa pontos como parte do pagamento.",
    icon: RefreshCw,
    color: "hsl(217 91% 60%)",
  },
];

export default function StepPurpose({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Finalidade da Oferta</Label>
      <p className="text-sm text-muted-foreground">
        Defina como os pontos serão tratados nesta oferta.
      </p>
      <div className="grid gap-3">
        {purposes.map((p) => {
          const Icon = p.icon;
          const selected = data.offer_purpose === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => update({ offer_purpose: p.value })}
              className={`p-4 rounded-xl border-2 flex items-start gap-4 text-left transition-colors ${
                selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${p.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: p.color }} />
              </div>
              <div>
                <span className="font-semibold block">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {data.offer_purpose === "BOTH" && (
        <div className="p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground">
          <strong>Exemplo:</strong> Produto R$ 100, resgate de 20 pts = R$ 20.
          O cliente paga R$ 80 em dinheiro e acumula 80 pontos.
        </div>
      )}
    </div>
  );
}
