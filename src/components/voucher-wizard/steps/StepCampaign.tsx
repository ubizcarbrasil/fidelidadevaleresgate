import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepCampaign({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Campanha / Motivo</Label>
      <p className="text-sm text-muted-foreground">Agrupe seus cupons por campanha para facilitar a análise.</p>
      <Input
        value={data.campaign}
        onChange={(e) => update({ campaign: e.target.value })}
        placeholder="Ex: Black Friday 2026, Aniversário, Parceria X"
        maxLength={100}
      />
    </div>
  );
}
