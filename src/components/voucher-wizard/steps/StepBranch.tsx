import { VoucherWizardData } from "../VoucherWizard";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  data: VoucherWizardData;
  update: (p: Partial<VoucherWizardData>) => void;
  branches: any[];
}

export default function StepBranch({ data, update, branches }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Em qual filial o cupom será válido? *</Label>
      <Select value={data.branch_id} onValueChange={(v) => update({ branch_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma filial" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name} ({(b.brands as any)?.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
