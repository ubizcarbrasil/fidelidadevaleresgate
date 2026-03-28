import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepUsageLimits({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Limites de Uso</Label>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Total máximo de usos</Label>
          <Input type="number" min="1" value={data.max_uses} onChange={(e) => update({ max_uses: e.target.value })} onBlur={(e) => { e.target.value = String(Number(e.target.value)); }} />
          <p className="text-xs text-muted-foreground">Quantas vezes o cupom pode ser usado no total</p>
        </div>
        <div className="space-y-2">
          <Label>Máximo por cliente</Label>
          <Input type="number" min="1" value={data.max_uses_per_customer} onChange={(e) => update({ max_uses_per_customer: e.target.value })} onBlur={(e) => { e.target.value = String(Number(e.target.value)); }} />
          <p className="text-xs text-muted-foreground">Quantas vezes cada cliente pode usar</p>
        </div>
      </div>
    </div>
  );
}
