import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { MapPin, Globe, MessageCircle } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

const TYPES = [
  { key: "PRESENCIAL" as const, label: "Presencial", icon: MapPin, desc: "O cliente resgata na loja física" },
  { key: "SITE" as const, label: "Site", icon: Globe, desc: "O cliente resgata pelo site da loja" },
  { key: "WHATSAPP" as const, label: "WhatsApp", icon: MessageCircle, desc: "O cliente resgata pelo WhatsApp" },
];

export default function StepRedemptionType({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Tipo de Resgate</Label>
      <p className="text-sm text-muted-foreground">Como o cliente vai resgatar este cupom?</p>
      <div className="space-y-3">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => update({ redemption_type: t.key })}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                data.redemption_type === t.key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <div className="text-left">
                <p className="font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
