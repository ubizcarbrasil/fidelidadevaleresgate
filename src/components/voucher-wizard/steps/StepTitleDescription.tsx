import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepTitleDescription({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Título do cupom *</Label>
        <Input
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Ex: 10% no aniversário"
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Detalhes sobre o cupom..."
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-muted-foreground text-right">{data.description.length}/500</p>
      </div>
    </div>
  );
}
