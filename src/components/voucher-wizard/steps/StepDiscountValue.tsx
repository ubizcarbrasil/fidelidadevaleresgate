import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepDiscountValue({ data, update }: Props) {
  if (data.discount_type === "FREE_SHIPPING") {
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold">Frete Grátis</Label>
        <p className="text-muted-foreground">Nenhum valor adicional necessário para este tipo.</p>
        <div className="space-y-2">
          <Label>Compra mínima para aplicar (R$)</Label>
        <Input type="number" min="0" step="0.01" value={data.min_purchase} onChange={(e) => update({ min_purchase: e.target.value })} onBlur={(e) => { e.target.value = String(Number(e.target.value)); }} />
        </div>
      </div>
    );
  }

  const isPercent = data.discount_type === "PERCENT";

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        {isPercent ? "Qual o percentual de desconto?" : "Qual o valor fixo de desconto?"}
      </Label>
      {isPercent ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="100"
              step="0.01"
              value={data.discount_percent}
              onChange={(e) => update({ discount_percent: e.target.value })}
              onBlur={(e) => { e.target.value = String(Number(e.target.value)); }}
              className="text-2xl font-bold max-w-[150px]"
            />
            <span className="text-2xl font-bold text-muted-foreground">%</span>
          </div>
          <p className="text-sm text-muted-foreground">Valor entre 1% e 100%</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-muted-foreground">R$</span>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={data.discount_fixed_value}
              onChange={(e) => update({ discount_fixed_value: e.target.value })}
              onBlur={(e) => { e.target.value = String(Number(e.target.value)); }}
              className="text-2xl font-bold max-w-[200px]"
            />
          </div>
        </div>
      )}
      <div className="space-y-2 pt-2">
        <Label>Compra mínima para aplicar (R$)</Label>
        <Input type="number" min="0" step="0.01" value={data.min_purchase} onChange={(e) => update({ min_purchase: e.target.value })} onBlur={(e) => { e.target.value = String(Number(e.target.value)); }} />
      </div>
    </div>
  );
}
