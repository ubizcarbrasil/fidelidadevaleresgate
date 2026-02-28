import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepValidity({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Período de Validade</Label>
      <p className="text-sm text-muted-foreground">Defina quando o cupom fica disponível para resgate.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Data de liberação</Label>
          <Input type="datetime-local" value={data.validity_start} onChange={(e) => update({ validity_start: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Data de expiração</Label>
          <Input type="datetime-local" value={data.validity_end} onChange={(e) => update({ validity_end: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
