import { VoucherWizardData } from "../VoucherWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { data: VoucherWizardData; update: (p: Partial<VoucherWizardData>) => void; }

export default function StepSchedule({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Agendamento e Validade</Label>
      <p className="text-sm text-muted-foreground">Defina quando o cupom começa e quando expira. Deixe em branco para sem limite.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Início</Label>
          <Input type="datetime-local" value={data.start_at} onChange={(e) => update({ start_at: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Expiração</Label>
          <Input type="datetime-local" value={data.expires_at} onChange={(e) => update({ expires_at: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
