import { VoucherWizardData } from "../VoucherWizard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepTerms({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Termos e Condições</Label>
      <p className="text-sm text-muted-foreground">Adicione regras, restrições ou condições especiais para este cupom.</p>
      <Textarea
        value={data.terms}
        onChange={(e) => update({ terms: e.target.value })}
        placeholder="Ex: Válido apenas para primeira compra. Não cumulativo com outras promoções..."
        rows={6}
        maxLength={2000}
      />
      <p className="text-xs text-muted-foreground text-right">{data.terms.length}/2000</p>
    </div>
  );
}
