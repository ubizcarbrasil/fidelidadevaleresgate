import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, UserCheck } from "lucide-react";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepAudience({ data, update }: Props) {
  const audiences = [
    { value: "ALL", label: "Todos os clientes", icon: Users, desc: "Qualquer pessoa pode usar" },
    { value: "SPECIFIC", label: "Cliente específico", icon: UserCheck, desc: "Restrito a um cliente" },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Público-alvo</Label>
      <div className="grid gap-3">
        {audiences.map((a) => {
          const Icon = a.icon;
          const active = data.target_audience === a.value;
          return (
            <button
              key={a.value}
              onClick={() => update({ target_audience: a.value })}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <div className={`p-2 rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{a.label}</p>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {data.target_audience === "SPECIFIC" && (
        <div className="grid gap-4 md:grid-cols-3 pt-2 border-t">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={data.customer_name} onChange={(e) => update({ customer_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={data.customer_phone} onChange={(e) => update({ customer_phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={data.customer_email} onChange={(e) => update({ customer_email: e.target.value })} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Switch checked={data.is_public} onCheckedChange={(v) => update({ is_public: v })} />
        <div>
          <Label>Cupom público</Label>
          <p className="text-xs text-muted-foreground">Visível na página pública de vouchers</p>
        </div>
      </div>
    </div>
  );
}
